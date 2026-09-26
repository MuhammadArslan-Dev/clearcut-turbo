# Server disk / load investigation — 2026-09-26

Notes so we can re-check later. Server: Hetzner VPS `ubuntu-8gb-hel1-1` (4 vCPU, 7.6 GB RAM, 75 GB disk, no swap), running Coolify + all app containers + MySQL/Postgres/Redis/n8n.

Trigger: server load went high again, and disk/usage seemed to grow after every code push.

---

## 1. What we changed on the server (all done by the user, by hand)

| # | Command | Result |
|---|---|---|
| 1 | `docker image prune -a --filter "until=3h"` | Removed unused images older than 3 h (old Sentinel tags, `coolify-helper:1.0.12`, old commit images of the backend apps). Docker printed "reclaimed 1.536GB", but real disk went **91% → 85%** (65 G → 61 G used). |
| 2 | `journalctl --vacuum-size=500M` | Freed **3.5 GB** of old system journals → **80%** (58 G used, 15 G free). |
| 3 | `/etc/systemd/journald.conf.d/size.conf` with `SystemMaxUse=500M`, then `systemctl restart systemd-journald` | Journal is now capped at 500 MB permanently. |
| 4 | `docker image prune -a --filter "until=30m"` | Removed 3 old dashboard images (`3f5cb4e`, `208addf`, `cabeb24`). Reclaimed **0 B**, disk unchanged (58 G) — their layers are shared with the running image. |

Nothing else was changed. Volumes were **not** touched.

Current state after the above: **80% used, 58 G / 75 G, 15 G free.**

## 2. What we found

### Disk breakdown (`du -xh /var`)
- `/var/lib/docker/overlay2` — **32 GB**
- `/var/lib/docker/volumes` — **21 GB** (9 volumes, all in use — databases / app data; do NOT delete)
- `/var/log/journal` — was **4.1 GB** (now capped at 500 MB)
- everything else is small (`/data` 2.2 GB, `/usr` 1.8 GB)

### Docker images
- `docker system df`: Images 31.8 GB (45), "reclaimable 16.94 GB" — this number is **misleading** (counts shared layers), it does not mean 17 GB can be freed.
- Sum of per-image UNIQUE sizes is only ~17–18 GB, but `overlay2` is 32 GB → **~14 GB is unexplained** (open item, see §4).
- Build cache is only 118 MB → BuildKit cache is not the problem.
- Dashboard app (`l84c8cwc8og4gkswkgksoo80`, tags are git commit SHAs) creates a new ~2.34 GB image per push. Removing old tags freed 0 B, i.e. layers are mostly shared/cached, so per-push growth is **not proven**. Correction to earlier guesses: neither "16.9 GB reclaimable" nor "+1.7 GB per push" is a reliable figure.
- Only the dashboard app was rebuilt recently; blog/landing/other app images are days–months old, so a push is not rebuilding every app.

### Journal was filling because of SSH brute force
- In 10 minutes: ~136 + 119 + 23 failed `root` password attempts from several IPs (217.160.190.176, 45.7.43.242, 109.160.32.43, 195.178.110.232), plus "user unknown" attempts. That is what grew the journal to 4 GB in 2 days.
- The 25 `session opened/closed for user root` lines are probably Coolify's own SSH to the host — so **do not disable root login** (it would break Coolify).
- The user said some of the failures were their own attempts (lost root password). Most are clearly bots. **Not acted on yet** (see §4).

### Coolify version
- Running: **`4.0.0-beta.442`** (only `ghcr.io/coollabsio/coolify` image on the box, in use).
- Latest at time of writing: **`v4.3.23`** (2026-09-18).
- Release `beta.466` fixed "Respect keep for rollback setting for Nixpacks build images (#8859)" — the dashboard is built with Nixpacks, so old images/leftovers can pile up on beta.442.
- Breaking changes between here and 4.3.x (from release notes): state-changing API endpoints are POST-only (405 on GET), router names for Compose services with dots/hyphens changed, deploy/redeploy confirmations removed, Sentinel mandatory.

### Coolify cleanup behaviour (docs)
- Server Settings → Docker Cleanup: cron schedule (default `0 0 * * *`), **Force** (runs every schedule) vs **threshold** (default 80%).
- It deliberately keeps **application images for rollback** and never touches volumes unless "Delete Unused Volumes" is enabled — **never enable that** here (the 21 GB of volumes are data).
- Number of app images kept for rollback is configurable per application; a server-level value can override it.

## 3. Snapshots for comparison

| When | Disk used | Avail | Notes |
|---|---|---|---|
| Health check, before | 65.82 GB / 88% (API) | | load 2.5 / 1.8 / 1.8 |
| Start of session | 65 G / **91%** | 7.1 G | load 1.18 / 1.93 / 1.95, RAM avail 3.1 G |
| After image prune | 61 G / 85% | 11 G | |
| After journal vacuum | 58 G / **80%** | 15 G | journal now 499.6 MB |

## 4. Open items / TODO (in suggested order)

1. **Coolify → Server → Docker Cleanup:** enable daily schedule; enable Force or set threshold ~70–80%. Keep "Delete Unused Volumes" and "Delete Unused Networks" **off**.
2. **Lower "images to keep for rollback"** per application (or at server level) to 2–3. (Exact UI label not in docs — look for "rollback" / "images to keep".)
3. **Find the ~14 GB gap in overlay2.** Run:
   ```sh
   docker info 2>/dev/null | grep -iE "Server Version|Storage Driver|driver-type"
   du -sh /var/lib/docker/overlay2/* 2>/dev/null | sort -h | tail -8
   ```
4. **Measure real per-push growth:** note `df -h /` and `du -sh /var/lib/docker/overlay2` before and after the next push.
5. **Update Coolify** (beta.442 → 4.3.x) — take a Hetzner snapshot + Coolify backup first, do it off-peak, and check webhooks/scripts that trigger deploys with GET (now POST-only) and any custom Traefik labels.
6. **Shrink the dashboard image** in the repo (currently ~2.34 GB because the whole monorepo + all `node_modules` are copied): Next.js `output: "standalone"` and a leaner `nixpacks.toml`. Not started.
7. **SSH hardening** (deferred by the user): disable password login (keep key login, and keep root login for Coolify), add `fail2ban`. Before that confirm key login works from the user's own machine so they don't lock themselves out. Ask: which of the failing IPs was theirs?
8. Optional: cap container log size in `/etc/docker/daemon.json` (`log-opts` `max-size`/`max-file`) — not checked yet whether container logs are large.

## 5. Commands cheat-sheet (run on the VPS host)

```sh
nproc; uptime; free -h; df -h /                    # quick health
docker system df                                   # docker usage summary (reclaimable is inflated)
docker system df -v | sed -n '/Images space usage/,/Containers space usage/p' | cut -c1-160
du -xh /var --max-depth=3 2>/dev/null | sort -h | tail -12
journalctl --disk-usage
docker ps --format '{{.Names}}  {{.Image}}' | grep -i coolify   # running Coolify version
```

## 6. Sources

- Coolify docs — Automated Docker Cleanup: https://coolify.io/docs/knowledge-base/server/automated-cleanup
- Coolify docs — Rollbacks: https://coolify.io/docs/applications/deployments/rollbacks
- GitHub discussion #3684 (auto-cleaning unused deployments): https://github.com/coollabsio/coolify/discussions/3684
- Release v4.0.0-beta.466 (Nixpacks keep-for-rollback fix): https://github.com/coollabsio/coolify/releases/tag/v4.0.0-beta.466
- Latest release (v4.3.23): https://github.com/coollabsio/coolify/releases/latest
- Coolify upgrade guide: https://coolify.io/docs/get-started/upgrade

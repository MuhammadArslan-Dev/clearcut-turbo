# Integration Rules

This file is the project's source of truth for how **any future third-party
integration** (payment gateway, analytics/tracking pixel, auth provider,
messaging/SMS/WhatsApp provider, CMS, storage, maps, CAPTCHA, or anything else
that talks to an external service) must be researched and implemented in this
repo. It does not document any currently-implemented integration — it defines
the process to follow before writing or changing integration code.

## Core rule

**Never assume our internal field/parameter name matches the provider's.**

Example: if the request is "send the user's phone number to Provider X," do
not default to a field called `phone` just because that's what we call it
internally. Check Provider X's current official docs for the exact key it
expects — it might be `ph`, `phone_number`, `contact`, `msisdn`, or something
else entirely, and it may require a specific format (digits only, country
code prefix, no `+`, hashed, lowercase, etc.). The exact key and format are
part of the contract, not a detail to infer from our own naming.

## Process — before implementing or changing any integration

1. **Identify the official source.** Use the provider's own current
   documentation (official docs site, official SDK reference, official
   GitHub repo) — not blog posts, Stack Overflow answers, AI memory/training
   data, or a competitor's implementation. If the installed SDK version's
   actual shipped type definitions / source disagree with the docs (docs can
   be stale or inconsistent across versions), the installed SDK's own types
   are the stronger authority for what the running code will actually accept
   — check both, and note the installed version when you do.
2. **Identify every parameter/field actually needed for the requested
   feature** and, for each one, confirm:
   - The exact supported key/parameter name.
   - The expected value format (type, casing, encoding, length, required
     prefix/suffix, hashing requirement, units).
   - Whether it's required or optional, and what the default behavior is if
     omitted.
   - Any parameters the provider does **not** support that might otherwise be
     assumed (e.g. a field that exists for one API/event type but not
     another).
3. **Identify the officially recommended implementation approach** — e.g.
   which SDK method/API endpoint to call, which script/snippet to load, which
   initialization order matters, and any provider-documented constraints
   (rate limits, one-time-only calls, fields that can only be set at a
   specific point such as first initialization, deprecated vs. current
   options). Prefer the provider's current, recommended, documented approach
   over an undocumented behavior that merely happens to work, even if a
   workaround is easier to implement.
4. **Only after verification, implement.** If verification is inconclusive
   (docs ambiguous, contradictory, or silent on something needed), say so
   explicitly before proceeding — don't silently pick one interpretation.
5. **Document the result in this file** (see format below) before considering
   the integration done — this file must stay current with what was actually
   verified and implemented, not just what was originally planned.

## Required documentation format for each integration entry

When an integration is implemented or changed, add/update a section in this
file with:

```markdown
## <Provider name> — <feature/purpose>

**Owner:** <app(s)/package(s) and file path(s) that implement this>
**Implementation approach:** <SDK call / REST endpoint / script tag — and why>

### Parameter mapping

| Our concept | Exact provider key | Format | Required? | Notes |
|---|---|---|---|---|

### Known limitations / constraints
- <e.g. a field can only be set on first call, a rate limit, a deprecated option still in use, a documented edge case>

### Unsupported / explicitly not used
- <parameters the provider documents but this integration deliberately doesn't send, and why — prevents a future contributor from assuming they're missing by accident>

**Verified against:** <official doc URL or SDK package+version> (checked <date>)
```

## Maintenance

- Update this file whenever a new integration is added, an existing one
  changes, or a provider's documented behavior/best practice changes (e.g. a
  config option is deprecated in favor of a new one).
- If a provider's docs are found to be internally inconsistent or wrong
  relative to the installed SDK, record which source won and why, so the next
  person doesn't re-litigate it from scratch.
- This file intentionally contains no entries yet for this repo's existing
  integrations — they have not been audited as part of creating this file.
  Add an entry for an existing integration only when it is next touched (built,
  changed, or deliberately audited on request), following the format above.

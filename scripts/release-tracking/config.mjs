// Release tracking (phase 117): which apps are tracked and where they deploy.
// Every value below was read from the real Coolify instances on 2026-11-17 (docs/phases/117-release-tracking.md §3).

// Tracking starts at this moment: deployments that finished earlier are never commented / recorded (no backfill).
// null = not switched on yet. Dry-run falls back to "last 7 days" and says so; a real write run refuses to start while this is null.
export const TRACK_FROM = null;

export const ENVIRONMENT = "production";
export const JIRA_PROJECT_KEYS = ["CC"];

// Monorepo files that every app of clearcut-turbo depends on (same list Coolify uses as watch_paths for dashboard / landing).
const ROOT_FILES = ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "turbo.json", "tsconfig.base.json"];

// host: "hetzner" = Coolify #1, "oracle" = Coolify #2. Credentials come from <HOST>_COOLIFY_URL / <HOST>_COOLIFY_TOKEN.
// paths: commits counted for this app (mirror of Coolify watch_paths); null = every commit in the range.
// gitSource: "local" = read the checked-out monorepo; "github" = other repo, needs a GitHub token (decision D2, not built yet).
export const APPS = [
  {
    id: "dashboard",
    label: "Dashboard",
    host: "oracle",
    uuid: "eeexh9bwpfhutfe6f1yomflf",
    repo: "MuhammadArslan-Dev/clearcut-turbo",
    gitSource: "local",
    url: "https://app.clearcutoff.in",
    sentryProject: "clearcutoff-nextjs-app",
    // verified: identical to the app's Coolify watch_paths
    paths: ["apps/dashboard/", "packages/", ...ROOT_FILES, "nixpacks.toml"],
  },
  {
    id: "blog",
    label: "Blog",
    host: "oracle",
    uuid: "zjszwdcgoht9gh1nrydyqysw",
    repo: "MuhammadArslan-Dev/clearcut-turbo",
    gitSource: "local",
    url: "https://academy.clearcutoff.in",
    sentryProject: "clearcutoff-public",
    // ASSUMPTION: Coolify has no watch_paths for the blog (it is deployed by hand); these are the paths its build uses.
    paths: ["apps/blog/", "packages/", ...ROOT_FILES],
  },
  {
    id: "landing",
    label: "Landing page",
    host: "hetzner",
    uuid: "l84c8cwc8og4gkswkgksoo80",
    repo: "MuhammadArslan-Dev/clearcut-turbo",
    gitSource: "local",
    url: "https://clearcutoff.in",
    sentryProject: "clearcutoff-public",
    // verified: identical to the app's Coolify watch_paths
    paths: ["apps/landing/", "packages/", ...ROOT_FILES, "nixpacks.toml"],
  },
  {
    id: "backend",
    label: "Backend API",
    host: "hetzner",
    uuid: "eosok4ogowgksowccksw4488",
    repo: "dalal-rohit/cc-new-backend",
    gitSource: "github",
    url: "https://apptest.clearcutoff.in",
    sentryProject: "laravel-backend",
    paths: null,
  },
];

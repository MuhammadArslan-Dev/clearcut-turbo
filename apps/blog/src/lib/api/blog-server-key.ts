import "server-only";

// Keys shared by the blog server and the Laravel backend, kept in code by
// request so no environment setup is needed; the backend has the same two
// values (config/services.php, 'blog'). An environment variable of the same
// name still overrides each one, so a leaked key can be rotated without a
// code change. An empty value (with no env var) turns that feature off: no
// rate-limit header is sent, and /api/revalidate refuses every request.
// "server-only": importing this from a client component fails the build
// instead of shipping the keys to browsers.
//   BLOG_SERVER_KEY   blog -> backend: X-Blog-Server-Key on /api/blog/* reads
//                     (backend-headers.ts), for the blog's own rate-limit bucket.
//   REVALIDATE_SECRET backend -> blog: Bearer secret on POST /api/revalidate.
const BLOG_SERVER_KEY = "8fD2kL9xQ7mV4pR6tN1zA5wH3yJ0cB8sE6uG9iK2";
const REVALIDATE_SECRET = "K7vP2xN9mR4qT8zL5bW1hF6dY3cA0uE9sG2jM8k";

/** Key the blog sends to the backend ("" when not set). */
export function blogServerKey(): string {
  return process.env.BLOG_SERVER_KEY || BLOG_SERVER_KEY;
}

/** Secret the backend must send to /api/revalidate ("" when not set). */
export function revalidateSecret(): string {
  return process.env.REVALIDATE_SECRET || REVALIDATE_SECRET;
}

import * as Sentry from "@sentry/nextjs";

type LogOptions = {
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  user?: {
    id?: string;
    email?: string;
  };
};

export const setSentryUser = (user: any) => {
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  Sentry.setUser({
    id: user.id,
    email: user.email || undefined, // optional
    username: user.full_name || undefined, // optional
  });
};

export const logger = {
  error(error: unknown, options?: LogOptions) {
    Sentry.withScope((scope) => {
      if (options?.tags) scope.setTags(options.tags);
      if (options?.extra) scope.setExtras(options.extra);
      if (options?.user) scope.setUser(options.user);

      Sentry.captureException(error);
    });
  },

  warn(message: string, options?: LogOptions) {
    Sentry.captureMessage(message, {
      level: "warning",
      ...options,
    });
  },

  info(message: string, options?: LogOptions) {
    Sentry.captureMessage(message, {
      level: "info",
      ...options,
    });
  },

  /**
   * For expected, non-disruptive conditions worth keeping visible for
   * debugging (e.g. as context on some later, unrelated error) but that
   * should never page anyone or clutter the issue stream on their own — a
   * dead-end 404, a duplicate-subscribe click already handled gracefully, a
   * declined card. Mirrors the backend's `sentry` log channel, which only
   * forwards `error` and above to Sentry for the exact same reason (see
   * config/logging.php there). Use `warn`/`error` instead for anything that
   * actually needs a human to look at it.
   */
  breadcrumb(message: string, options?: LogOptions) {
    Sentry.addBreadcrumb({
      message,
      level: "warning",
      category: options?.tags?.module ?? "app",
      data: options?.extra,
    });
  },
};

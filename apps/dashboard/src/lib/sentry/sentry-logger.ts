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
};

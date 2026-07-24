// config/theme.ts

export type Theme = {
  colors: {
    primary: string;
    primarySoft: string;
    primaryStrong: string;
    bg: string;
    bgSoft: string;
    surface: string;
    border: string;
    text: string;
    textMuted: string;
    danger: string;
    success: string;
    warning: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  spacing: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: string;
    8: string;
    10: string;
    12: string;
  };
  layout: {
    sidebarWidth: string;
    headerHeight: string;
    containerMaxWidth: string;
  };
};

export const theme: Theme = {
  colors: {
    primary: 'var(--color-primary)',
    primarySoft: 'var(--color-primary-soft)',
    primaryStrong: 'var(--color-primary-strong)',
    bg: 'var(--color-bg)',
    bgSoft: 'var(--color-bg-soft)',
    surface: 'var(--color-surface)',
    border: 'var(--color-border)',
    text: 'var(--color-text)',
    textMuted: 'var(--color-text-muted)',
    danger: 'var(--color-danger)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
  },
  radius: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
    full: 'var(--radius-full)',
  },
  spacing: {
    1: 'var(--space-1)',
    2: 'var(--space-2)',
    3: 'var(--space-3)',
    4: 'var(--space-4)',
    5: 'var(--space-5)',
    6: 'var(--space-6)',
    8: 'var(--space-8)',
    10: 'var(--space-10)',
    12: 'var(--space-12)',
  },
  layout: {
    sidebarWidth: 'var(--sidebar-width)',
    headerHeight: 'var(--header-height)',
    containerMaxWidth: 'var(--container-max-width)',
  },
};
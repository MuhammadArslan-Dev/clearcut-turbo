import { CourseStatus, STATUS_CONFIG } from './courseStatus';
import { TRIAL_DAYS } from './trialDaysLeft';

type Options = {
  color?: boolean;
  /** For `trial`: days left, shown in the label (CC-67). Defaults to TRIAL_DAYS. */
  trialDaysLeft?: number;
};

export function getCourseStatus(
  status: CourseStatus | null | undefined,
  t: (key: string, values?: Record<string, string | number>) => string,
  options: Options = { color: false }
) {
  if (!status || !STATUS_CONFIG[status]) {
    return {
      label: t('course.courseStatus.unknown'),
      ...(options.color && { color: 'bg-gray-100 text-gray-500' }),
    };
  }

  const config = STATUS_CONFIG[status];

  return {
    label:
      status === 'trial'
        ? t(config.labelKey, {
            days: options.trialDaysLeft ?? TRIAL_DAYS,
            // Shown as text so Marathi keeps Latin digits like the rest of the app.
            daysText: String(options.trialDaysLeft ?? TRIAL_DAYS),
          })
        : t(config.labelKey),
    ...(options.color && { color: config.color }),
  };
}


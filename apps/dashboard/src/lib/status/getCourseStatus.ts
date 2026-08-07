import { CourseStatus, STATUS_CONFIG } from './courseStatus';

type Options = {
  color?: boolean;
};

export function getCourseStatus(
  status: CourseStatus | null | undefined,
  t: (key: string) => string,
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
    label: t(config.labelKey),
    ...(options.color && { color: config.color }),
  };
}


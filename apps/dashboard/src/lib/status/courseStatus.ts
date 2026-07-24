export type CourseStatus =
  | 'trial'
  | 'trial_end'
  | 'active'
  | 'completed'
  | 'dropped'
  | 'expired'
  | 'cleared';

type StatusConfig = {
  labelKey: string;
  color: string;
};

export const STATUS_CONFIG: Record<CourseStatus, StatusConfig> = {
  trial: {
    labelKey: 'course.courseStatus.trial',
    color: 'bg-blue-100 text-blue-700',
  },
  trial_end: {
    labelKey: 'course.courseStatus.trialEnd',
    color: 'bg-yellow-100 text-yellow-700',
  },
  active: {
    labelKey: 'course.courseStatus.active',
    color: 'bg-green-100 text-green-700',
  },
  completed: {
    labelKey: 'course.courseStatus.completed',
    color: 'bg-emerald-100 text-emerald-700',
  },
  dropped: {
    labelKey: 'course.courseStatus.dropped',
    color: 'bg-red-100 text-red-700',
  },
  expired: {
    labelKey: 'course.courseStatus.expired',
    color: 'bg-gray-100 text-gray-600',
  },
  cleared: {
    labelKey: 'course.courseStatus.cleared',
    color: 'bg-purple-100 text-purple-700',
  },
};

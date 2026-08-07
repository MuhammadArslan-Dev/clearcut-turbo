// src/lib/analytics/types.ts

import type {
  AuthEventName,
  AuthEventPayloads,
} from './events/auth';

import type {
  OnboardingEventName,
  OnboardingEventPayloads,
} from './events/onboarding';

import type {
  NavigationEventName,
  NavigationEventPayloads,
} from './events/navigation';

import type {
  CourseEngagementEventName,
  CourseEngagementEventPayloads,
} from './events/course_engagement';

import type {
  EngagementExamEventName,
  EngagementExamEventPayloads,
} from './events/engagement_exam';

import type {
  TestSeriesEventName,
  TestSeriesEventPayloads,
} from './events/test_series';

import type {
  MonetizationEventName,
  MonetizationEventPayloads,
} from './events/monetization';

import type {
  ExamEventName,
  ExamEventPayloads,
} from './events/exam';

import type {
  AccountEventName,
  AccountEventPayloads,
} from './events/account';

import type {
  SystemEventName,
  SystemEventPayloads,
} from './events/system';

// --------------------------------------------------
// 1. Global union of ALL event names
// --------------------------------------------------

export type AnalyticsEventName =
  | AuthEventName
  | OnboardingEventName
  | NavigationEventName
  | CourseEngagementEventName
  | EngagementExamEventName
  | TestSeriesEventName
  | MonetizationEventName
  | ExamEventName
  | AccountEventName
  | SystemEventName;

// --------------------------------------------------
// 2. Event name -> payload map
// --------------------------------------------------

export interface AnalyticsEventPayloadMap
  extends AuthEventPayloads,
    OnboardingEventPayloads,
    NavigationEventPayloads,
    CourseEngagementEventPayloads,
    EngagementExamEventPayloads,
    TestSeriesEventPayloads,
    MonetizationEventPayloads,
    ExamEventPayloads,
    AccountEventPayloads,
    SystemEventPayloads {}

// --------------------------------------------------
// 3. Payload resolver helper
// --------------------------------------------------

export type AnalyticsEventPayload<
  TName extends AnalyticsEventName
> = AnalyticsEventPayloadMap[TName];

// --------------------------------------------------
// 4. User traits
// --------------------------------------------------

// --------------------------------------------------
// 4. User traits
// --------------------------------------------------

export type AnalyticsUserTraits = {
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  plan?: 'free' | 'pro' | 'enterprise';

  // product traits
  up_is_premium?: boolean;
  up_preferred_app_language?: 'en' | 'hi';
  up_preferred_content_language?: 'en' | 'hi';

  // escape hatch
  [key: string]: string | number | boolean | null | undefined;
};


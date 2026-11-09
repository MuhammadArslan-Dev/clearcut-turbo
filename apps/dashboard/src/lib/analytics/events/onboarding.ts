// src/lib/analytics/events/activation.ts
export type AppLanguageCode = 'en' | 'hi' | 'mr';

export type OnboardingEventName =
  | 'Onboarding Started'
  | 'Onboarding Step Completed'
  | 'Onboarding Step Reversed'
  | 'Onboarding Completed'
  | 'Exam Details Selection Started'
  | 'Exam Details Selection Completed';

export interface OnboardingEventPayloads {
  'Onboarding Started': {
    entry_step_number: number;
    entry_step_name: string;
  };

  'Onboarding Step Completed': {
    step_number: number;
    step_name: string;
    app_language_choice?: string;
    exam_choice?: string;
    // level_selection step (CC-81): the path the student picked, paper first.
    selected_navigation_ids?: number[];
    selected_navigation_names?: string[];
  };

  'Onboarding Step Reversed': {
    from_step_number: number;
    to_step_number: number;
  };

  'Onboarding Completed': {
    entry_step_name: string;
    up_onboarding_status: string;
    up_chosen_exam_id: string;
    up_preferred_app_language: string;
  };

  'Exam Details Selection Started': {
    step_number: number;
    step_name: string;
    content_language_choice: string;
    paper_choice: string;
    subject_combination_choice: string;
  };

  'Exam Details Selection Completed': {};
}

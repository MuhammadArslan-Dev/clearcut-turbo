// src/lib/analytics/events/activation.ts
export type AppLanguageCode = 'en' | 'hi' | 'mr';

export type OnboardingEventName =
  | 'Onboarding Started'
  | 'Onboarding Step Completed'
  | 'Onboarding Step Reversed'
  | 'Onboarding Completed'
  | 'Exam Details Selection Started'
  | 'Exam Details Selection Completed'
  | 'Setup Sheet Closed';

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

  // Phase 122: fired by the Select Paper / Select Subjects sheet (buy-sigle-course-modal) in BOTH variants of
  // `dash_all_setup_first_202611`: Started = the sheet opened, Completed = one step done (paper picked / subjects picked).
  'Exam Details Selection Started': SetupEventContext & {
    step_number: number;
    step_name: string;
    content_language_choice?: string;
    paper_choice?: string;
    subject_combination_choice?: string;
  };

  'Exam Details Selection Completed': Partial<SetupEventContext> & {
    step_number?: number;
    step_name?: string;
    paper_choice?: string;
    subject_combination_choice?: string;
  };

  /** Phase 122: the sheet was closed without saving (X, back, backdrop, "Do it later"). */
  'Setup Sheet Closed': SetupEventContext & {
    last_step: string;
    had_paper: boolean;
    close_method: string;
  };
}

/** Phase 122: context on every setup-sheet event. `experiment_*` only for a learner who is in the experiment. */
export type SetupEventContext = {
  exam_name: string;
  setup_source: string;
  /** true while no enrolment of the learner has a level yet (the experiment's population). */
  first_setup: boolean;
  experiment_flag?: string;
  experiment_variant?: string;
};

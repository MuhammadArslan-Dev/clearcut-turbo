// src/lib/analytics/events/account.ts

export type LanguageType = 'app_language' | 'content_language';

// --- Event names ---

export type AccountEventName =
  | 'Profile Option Clicked'
  | 'Profile Edit Started'
  | 'Profile Updated'
  | 'Language Setting Changed'
  // CC-174: the learner hard-deleted their saved Tools photo / signature (also sent by apps/tools).
  | 'Saved Images Deleted';

// --- Payloads ---

export interface AccountEventPayloads {
  'Saved Images Deleted': {
    place: 'dashboard_profile';
  };

  'Profile Option Clicked': {
    option_selected: string;
  };

  'Profile Edit Started': {
    section_edited: string;
  };

  'Profile Updated': {
    updated_fields: string[];
  };

  'Language Setting Changed': {
    language_type: LanguageType;
    from_language: string;
    to_language: string;
  };
}

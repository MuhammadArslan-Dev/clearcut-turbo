// src/lib/analytics/events/account.ts

export type LanguageType = 'app_language' | 'content_language';

// --- Event names ---

export type AccountEventName =
  | 'Profile Option Clicked'
  | 'Profile Edit Started'
  | 'Profile Updated'
  | 'Language Setting Changed';

// --- Payloads ---

export interface AccountEventPayloads {
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

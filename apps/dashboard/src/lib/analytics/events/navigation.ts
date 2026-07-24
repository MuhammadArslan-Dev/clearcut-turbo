// src/lib/analytics/events/navigation.ts

export type NavigationEventName =
  | 'Learning Path Switched'
  | 'Navigation Reversed'
  | 'Index Viewed'
  | 'Index Navigated'
  | 'Primary Nav Clicked';

export interface NavigationEventPayloads {
  'Learning Path Switched': {
    from_path: string;
    to_path: string;
  };

  'Navigation Reversed': {
    from_page_context: string;
    to_page_context: string;
    trigger_context: string;
  };

  'Index Viewed': {
    source_page: string;
  };

  'Index Navigated': {
    selected_content: 'chapter' | 'section';
    selected_chapter_id: string;
    selected_chapter_name: string;
  };

  'Primary Nav Clicked': {
    tab_name: string;
  };
}

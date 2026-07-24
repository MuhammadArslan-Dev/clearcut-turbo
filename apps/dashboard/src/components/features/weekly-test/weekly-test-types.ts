// API response types — exact shape from /api/v2/practice-test/:uuid

export interface ApiTranslation {
  id: number
  question_new_id: number
  locale: 'en' | 'hi'
  question: string
  question_image: string | null
  option_1_text: string
  option_1_image: string | null
  option_2_text: string
  option_2_image: string | null
  option_3_text: string
  option_3_image: string | null
  option_4_text: string
  option_4_image: string | null
  ai_time_to_solve: number | null
}

export interface ApiQuestion {
  id: number
  question_id: string
  topic_id: string
  translations: ApiTranslation[]
}

export interface ApiPracticeTestQuestion {
  id: number
  practice_test_id: number
  question_id: number
  sort_order: number
  marks: number
  question: ApiQuestion
}

export interface ApiTopic {
  id: number
  name: string
}

export interface ApiMetaJson {
  topics: ApiTopic[]
  duration: number
  course_id: string
  exam_name: string | null
  allow_guest: boolean
  section_name: string
  shuffle_questions: boolean
}

export interface ApiPracticeTest {
  id: number
  uuid: string
  title: string
  type: string
  status: string
  meta_json: ApiMetaJson
  created_at: string
  updated_at: string
  questions: ApiPracticeTestQuestion[]
}

export interface PracticeTestApiResponse {
  status: string
  message: string
  data: ApiPracticeTest
}

// Internal view model

export type Translation = ApiTranslation

export interface Question {
  id: number
  examSource: string
  topicId: string
  marks: number
  en: ApiTranslation | undefined
  hi: ApiTranslation | undefined
  correctOption: number // 0-indexed; sourced separately from submission result
}

export interface OptionItem {
  text: string
  image: string | null
}

export type Locale = 'en' | 'hi'
export type SelectedAnswers = Record<number, number>
export type SheetTab = 'progress' | 'questions' | 'topics' | null

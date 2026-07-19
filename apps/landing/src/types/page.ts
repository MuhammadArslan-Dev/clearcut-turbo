export interface PageProps {
  params: { slug?: string; locale?: string; courseName?: string };
}

export type Price = {
  final_price: number;
  actual_price: string;
};

export type Exam = {
  exam_id: number | string;
  uuid: string | null;

  name: string;
  short_name: string;

  state: string | null;
  conducting_body: string | null;

  logo_url: string | null;

  exam_type: string | null;
  exam_frequency: string | null;
  evaluation_type: string | null;

  ai_evaluation_supported: boolean | null;

  status: string;

  rating: string | number | null;

  price: Price | null;
  combo_price: Price | null;

  upcoming_exam_date: string | null; // ISO date string

  marking_schema: unknown; // or specific type if known
  metadata: Record<string, unknown> | null;

  translation: Record<string, unknown> | null;
};

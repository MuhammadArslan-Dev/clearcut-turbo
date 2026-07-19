// /types/assessment.ts
export type Option = {
  id: string;
  label: string;
  subtitle?: string;
  value: number;
};

export type Question = {
  id: string;
  no: number;
  title: string;
  options: Option[];
};

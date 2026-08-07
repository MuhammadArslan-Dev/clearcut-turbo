interface Question {
    id: number;
    question_number: string;
    question_text: string;
    language_code: string;
    question_image_url: string;
    option_1_text: string;
    option_1_image_url: string;
    option_2_text: string;
    option_2_image_url: string;
    option_3_text: string;
    option_3_image_url: string;
    option_4_text: string;
    option_4_image_url: string;
    correct_option: number;
    explanation: string;
    section_id: number;
    stage_id: number;
    exam_instance_id: string;
    createdAt: string;
    updatedAt: string;
}

interface Chapter {
    id: number;
    slug: string;
    chapter_id: string;
    name: string;
}
interface Topic {
    id: number;
    slug: string;
    topic_id: string;
    name: string;
}

interface QuestionList {
    data: Question[];
    total: number;
}

interface QuestionListByChapter {
    data: Question[];
    total: number;
}

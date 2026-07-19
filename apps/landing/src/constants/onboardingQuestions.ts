import { Question } from "@/utils/assessment";

export const QUESTIONS: Question[] = [
  {
    id: "importance",
    no: 1,
    title: "How important is clearing HTET for you this time?",
    options: [
      { id: "dream", label: "Very Important", value: 1.5, subtitle: "It's my dream job" },
      { id: "stability", label: "Must Clear", value: 1, subtitle: "Need financial stability" },
      { id: "trying", label: "Just Trying", value: 0.5, subtitle: "Still exploring" },
    ],
  },
  {
    id: "closeness",
    no: 2,
    title: "How close do you feel to selection right now?",
    options: [
      { id: "very_close", label: "Very close", value: 2.5 },
      { id: "improving", label: "Improving slowly", value: 1.5 },
      { id: "far", label: "Still far", value: 0.5 },
    ],
  },
  {
    id: "obstacle",
    no: 3,
    title: "What is your biggest obstacle?",
    options: [
      { id: "forget", label: "I forget after studying", value: 2.0 },
      { id: "concept", label: "Concepts not clear", value: 1.0 },
      { id: "time", label: "Not enough time", value: 0.5 },
    ],
  },
  {
    id: "consistency",
    no: 4,
    title: "How consistent are you?",
    options: [
      { id: "consistent", label: "Mostly consistent", value: 3.0 },
      { id: "mid", label: "3-4 days/week", value: 1.5 },
      { id: "low", label: "Struggle", value: 0.5 },
    ],
  },
  {
    id: "need",
    no: 5,
    title: "What do you need most?",
    options: [
      { id: "mock", label: "Mock Tests & PYQs", value: 1.0 },
      { id: "plan", label: "Daily Study Plan", value: 0.7 },
      { id: "help", label: "Weak subject help", value: 0.5 },
    ],
  },
];

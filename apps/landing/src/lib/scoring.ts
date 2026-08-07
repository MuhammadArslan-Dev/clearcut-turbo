export function calculateScore(answers: Record<string, number>) {
  return Object.values(answers).reduce((a, b) => a + b, 0);
}

export function getScoreColor(score: number) {
  if (score <= 5) return "red";
  if (score < 7.5) return "yellow";
  return "green";
}

const MESSAGES = {
  red: {
    title: "Your score is in risk zone!",
    description: "You need a structured plan to qualify this time.",
  },
  yellow: {
    title: "You are in border zone!",
    description: "You are close, but small mistakes could cost you the whole year.",
  },
  green: {
    title: "You are selection ready!",
    description: "Excellent! Now maintain this lead with a final revision plan.",
  },
};

export function getMessage(color: string) {
  return MESSAGES[color as keyof typeof MESSAGES] ?? MESSAGES.green;
}

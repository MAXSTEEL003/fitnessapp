const quotes = [
  "Pain is temporary. Quitting lasts forever.",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "The only bad workout is the one that didn't happen.",
  "Discipline is doing what needs to be done, even when you don't want to do it.",
  "Success is the sum of small efforts repeated day after day.",
  "Don't wish for it. Work for it.",
  "The hard days are what make you stronger.",
  "You didn't come this far to only come this far.",
  "Sweat is fat crying.",
  "Results happen over time, not overnight. Work hard, stay consistent, and be patient.",
  "Wake up with determination. Go to bed with satisfaction.",
  "Every rep, every set, every meal counts.",
  "The difference between try and triumph is just a little umph!",
  "Strive for progress, not perfection.",
  "It's going to be a journey. It's not a sprint to get in shape.",
  "Your future self will thank you.",
  "Make yourself proud.",
  "Champions are made when no one is watching.",
  "The pain you feel today will be the strength you feel tomorrow.",
  "Commitment is doing the thing you said you were going to do, long after the mood you said it in has left you.",
];

export const getMotivationalQuote = (): string => {
  const today = new Date().toISOString().split('T')[0];
  const hash = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return quotes[hash % quotes.length];
};

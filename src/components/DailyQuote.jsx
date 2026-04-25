const quotes = [
  "Your career grows when your excuses stop.",
  "Apply today. Your future self will thank you.",
  "One application can change your life.",
  "Consistency beats motivation.",
  "Dream jobs are found by people who keep applying.",
  "Small steps daily create big career wins.",
  "Rejection is redirection. Keep moving.",
  "Your visa journey is hard, but your dream is stronger.",
  "From India to USA, every step matters.",
  "Don’t wait for opportunity. Apply for it.",
  "Today’s application can become tomorrow’s offer.",
  "Keep applying until your inbox says congratulations."
];

function DailyQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];

  return <p className="quote">“{quote}”</p>;
}

export default DailyQuote;
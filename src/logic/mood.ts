import natural from 'natural';

const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
const tokenizer = new natural.WordTokenizer();

export function analyzeMoodJournal(text: string) {
  if (!text) return { sentiment: 'neutral', score: 0 };
  
  const tokens = tokenizer.tokenize(text) || [];
  const score = analyzer.getSentiment(tokens);
  
  let sentiment = 'neutral';
  if (score > 0.5) sentiment = 'positive';
  else if (score < -0.5) sentiment = 'negative';
  
  return { sentiment, score };
}

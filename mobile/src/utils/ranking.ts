export function normalizeReaderScore(readerScore: number) {
  return readerScore * 10;
}

export function calculateFinalScore(voteCount: number, readerScore: number) {
  return voteCount * 0.7 + normalizeReaderScore(readerScore) * 0.3;
}

export function validateRankingInput(voteCount: number, readerScore: number) {
  return voteCount >= 0 && readerScore >= 1 && readerScore <= 10;
}


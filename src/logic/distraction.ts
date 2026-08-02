export function detectDistraction(timeSpent: number) {
  if (timeSpent > 30) return 'HIGH';
  return 'LOW';
}

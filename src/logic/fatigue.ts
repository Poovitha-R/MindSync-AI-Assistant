export function detectFatigue(workDuration: number) {
  if (workDuration > 90) return 'HIGH';
  if (workDuration >= 45) return 'MEDIUM';
  return 'LOW';
}

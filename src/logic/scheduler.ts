interface Recommendation {
  task: string;
  reason: string;
}

export function generateRecommendation(mood: string, fatigue: string, distraction: string): Recommendation {
  if (mood === 'Tired' && fatigue === 'HIGH') {
    return {
      task: 'Take a 15-minute BREAK',
      reason: 'Your fatigue level is high and you feel tired. A break will help you recharge.'
    };
  }

  if (mood === 'Bored' && distraction === 'HIGH') {
    return {
      task: 'Start with an EASY TASK',
      reason: 'You are easily distracted and bored. A small win will help build momentum.'
    };
  }

  if (mood === 'Focused' && fatigue === 'LOW') {
    return {
      task: 'Start a HARD TASK',
      reason: 'Your focus is high and fatigue is low. This is the best time for deep work.'
    };
  }

  // Default recommendation
  return {
    task: 'Easy Task → Hard Task → Break',
    reason: 'A balanced approach to maintain steady productivity.'
  };
}

export function getNudge(mood: string, fatigue: string, distraction: string, socialTime: number): string {
  if (socialTime > 30) {
    return `You watched social media for ${socialTime} minutes. Ready for a 10-minute focus sprint?`;
  }
  if (fatigue === 'HIGH') {
    return "You seem tired. Take a short break and return refreshed.";
  }
  if (mood === 'Focused') {
    return "You're in the zone! Keep going, you're doing great.";
  }
  return "Ready to make some progress today?";
}

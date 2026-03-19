export const ACHIEVEMENT_TYPES = {
  STREAK: 'streak',
  FOCUS: 'focus',
  USAGE: 'usage',
  CHALLENGE: 'challenge',
  ONBOARDING: 'onboarding'
};

export const ACHIEVEMENTS = {
  FIRST_GOAL: {
    id: 'FIRST_GOAL',
    type: ACHIEVEMENT_TYPES.ONBOARDING,
    title: 'Перший Крок',
    description: 'Встановити свою першу ціль/ліміт',
    icon: 'flag-outline',
    points: 10
  },
  THREE_GOALS: {
    id: 'THREE_GOALS',
    type: ACHIEVEMENT_TYPES.ONBOARDING,
    title: 'Цілеспрямований',
    description: 'Встановити три різні цілі',
    icon: 'flag-triangle',
    points: 25
  },
  DAILY_LIMIT_KEEPER: {
    id: 'DAILY_LIMIT_KEEPER',
    type: ACHIEVEMENT_TYPES.USAGE,
    title: 'Дисциплінований',
    description: 'Дотримуватися встановленого ліміту протягом одного дня',
    icon: 'shield-check-outline',
    points: 20
  },
  WEEKLY_SPRINTER: {
    id: 'WEEKLY_SPRINTER',
    type: ACHIEVEMENT_TYPES.STREAK,
    title: 'Тижневий Спринтер',
    description: 'Дотримуватися всіх встановлених лімітів протягом тижня',
    icon: 'run-fast',
    points: 50
  },
  FIRST_FOCUS: {
    id: 'FIRST_FOCUS',
    type: ACHIEVEMENT_TYPES.FOCUS,
    title: 'Час для Фокусу',
    description: 'Успішно завершити першу фокус-сесію',
    icon: 'timer-outline',
    points: 15
  },
  FOCUS_MASTER: {
    id: 'FOCUS_MASTER',
    type: ACHIEVEMENT_TYPES.FOCUS,
    title: 'Концентратор',
    description: 'Успішно завершити 5 фокус-сесій',
    icon: 'brain',
    points: 30
  }
}; 
export const GameLevels = ['easy', 'medium', 'hard', 'super-hard'] as const

export type GameLevel = (typeof GameLevels)[number]

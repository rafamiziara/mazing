export const GameStatuses = ['initializing', 'ready', 'running', 'paused', 'finished'] as const

export type GameStatus = (typeof GameStatuses)[number]

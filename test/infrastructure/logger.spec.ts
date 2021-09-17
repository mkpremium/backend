import { stub } from 'sinon'
import { Logger } from '../../src/infrastructure/logger'

export function createLoggerMock() {
  return {
    info: stub(),
    error: stub(),
    crit: stub(),
  } as unknown as Logger
}

import { spy, stub } from 'sinon'
import { Logger } from '../../src/infrastructure/logger'

export function createLoggerMock () {
  return {
    info: stub(),
    warning: spy(),
    error: stub(),
    crit: stub()
  } as unknown as Logger
}

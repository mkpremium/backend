import { asClass, AwilixContainer } from 'awilix'
import { History } from './models'

export const setupHistoryDependencies = (container: AwilixContainer) => {
  container.register({
    historyRepository: asClass(History).classic().singleton()
  })
}

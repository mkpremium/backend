import { asClass, AwilixContainer } from 'awilix'
import { ContactsRepository } from './contacs.repository'

export function setupContactsDependencies (container: AwilixContainer) {
  container.register({
    contactsRepository: asClass(ContactsRepository).singleton().classic()
  })
}

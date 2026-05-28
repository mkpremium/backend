import { ContactDTO } from '../../types/contact-dto'
import { TaskCall } from '../../types/task-call'

export const transformContactsToTask = (contacts:ContactDTO[]) => {
  const tasks:TaskCall[] = contacts.map(contact => ({
    toNumber: contact.phoneNumber,
    variables: {
      name: contact.name,
      lastName: contact.lastName,
      address: contact.address
    },
    metadata: {
      buildingId: contact.buildingId,
      ownerId: contact.ownerId,
      contactId: contact.contactId,
      city: contact.city,
      use: contact.use,
      callQueueId: contact.callQueueId,
      address: contact.address
    }
  }))
  return tasks
}

export const transformContactToTask = (contact: ContactDTO): TaskCall[] => [
  {
    toNumber: contact.phoneNumber,
    variables: {
      name: contact.name,
      lastName: contact.lastName,
      address: contact.address
    },
    metadata: {
      buildingId: contact.buildingId,
      ownerId: contact.ownerId,
      contactId: contact.contactId,
      city: contact.city,
      use: contact.use,
      callQueueId: contact.callQueueId,
      address: contact.address
    }
  }
]

import { ContactProps, OwnerStatus, OwnerType } from '../owner'

export interface AddOwnerCommand {
  verified: boolean,
  buildingId: string,
  status: OwnerStatus,
  type: OwnerType,
  note: string,
  person: {
    name: string,
    firstName: string,
    firstSurname: string,
    secondSurname: string,
    contacts: ContactProps[]
  }
}

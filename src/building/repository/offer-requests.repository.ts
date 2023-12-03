import { ScheduledEventProps } from '../../scheduled-events/types'

export interface AddBuildingOffertCommand {
  flipperId: string,
  callerId: string,
  ownerId: string,
  destinationContactId: string,
  worksheetId: string,
  buildingId: string
}

export interface OfferRequestsRepository {
  add (offer: AddBuildingOffertCommand): Promise<AddBuildingOffertCommand & {id: string}>
}

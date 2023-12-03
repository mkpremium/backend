import { ScheduledEventProps } from '../../scheduled-events/types'

export interface AddOfferCommand {
  flipperId: string,
  callerId: string,
  ownerId: string,
  destinationContactId: string,
  worksheetId: string,
  buildingId: string
}

export interface OfferRequestsRepository {
  add (offer: AddOfferCommand): Promise<AddOfferCommand & {id: string}>
}

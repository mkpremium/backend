export interface AddBuildingOfferCommand {
  flipperId: string,
  callerId: string,
  ownerId: string,
  destinationContactId: string,
  worksheetId: string,
  buildingId: string
}

export interface OfferRequestsRepository {
  add (offer: AddBuildingOfferCommand): Promise<AddBuildingOfferCommand & {id: string}>
}

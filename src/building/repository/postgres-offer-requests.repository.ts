import { AddOfferCommand, OfferRequestsRepository } from './offer-requests.repository'
import Promise from 'bluebird'

export class PostgresOfferRequestsRepository implements OfferRequestsRepository {
  add (offer: AddOfferCommand): Promise<AddOfferCommand & { id: string }> {
    return Promise.reject(new Error('Not implemented'))
  }
}

import t from 'tcomb'
import { validate } from 'tcomb-validation'
import { InvalidCommand } from '../../infrastructure/invalid-command.error'
import { EventPublisher } from '../../infrastructure/event-bus'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'
import { EntityManager } from 'typeorm'
import { CouchbaseOfferRequestsRepository } from '../repository/couchbase-offer-requests.repository'
import { BuildingOfferRequest } from '../repository/building-offer-request.entity'
import { Building } from '../building.entity'
import { Flipper } from '../../flipper/flipper.entity'
import { Caller } from '../../caller/caller.entity'
import { CouchbaseBuildingsRepository } from '../repository/couchbase-building.repository'

interface AddOfferRequestCommand {
  ownerId: string,
  destinationContactId: string,
  reporterContactId: string,
  buildingId: string,
  callerId: string,
  flipperId: string,
  note: string
}

const AddOfferRequestCommand = t.struct<AddOfferRequestCommand>({
  ownerId: t.String,
  destinationContactId: t.String,
  reporterContactId: t.String,
  buildingId: t.String,
  callerId: t.String,
  flipperId: t.String,
  worksheetId: t.maybe(t.String),
  note: t.String
})

export interface OfferRequestCreated {
  name: DomainEventCatalog.OFFER_REQUEST__CREATED
  note: string
  userId: string
  buildingId: string
  request: any
}

export interface AddBuildingOfferCommand {
  flipperId: string,
  callerId: string,
  ownerId: string,
  destinationContactId: string,
  worksheetId?: string,
  buildingId: string
}

export class AddOfferRequestService {
  constructor (
    private couchbaseOfferRequestsRepository: CouchbaseOfferRequestsRepository,
    private couchbaseBuildingsRepository: CouchbaseBuildingsRepository,
    private eventBus: EventPublisher,
    private usePostgres: boolean,
    private entityManager: EntityManager
  ) {
  }

  async addOfferRequest (cmd: AddOfferRequestCommand) {
    this.assertValidCommand(cmd)

    await (this.usePostgres ? this.doPostgres(cmd) : this.doCouchbase(cmd))
  }

  private assertValidCommand (command: AddOfferRequestCommand) {
    const validation = validate(command, AddOfferRequestCommand)
    if (!validation.isValid()) {
      throw new InvalidCommand(validation.errors)
    }
  }

  private async doPostgres (cmd: AddOfferRequestCommand): Promise<AddBuildingOfferCommand & { id: string }> {
    return this.entityManager.transaction(async entityManager => {
      const flipper = await entityManager.findOneByOrFail(Flipper, [
        { id: cmd.flipperId },
        { user: { id: cmd.flipperId } }
      ])
      const caller = await entityManager.findOneByOrFail(Caller, [
        { id: cmd.callerId },
        { user: { id: cmd.callerId } }
      ])
      const savedOfferRequest = await entityManager.save(BuildingOfferRequest, {
        flipper,
        caller,
        owner: { id: cmd.ownerId },
        contact: { id: cmd.destinationContactId },
        building: { id: cmd.buildingId }
      })
      await entityManager.update(Building, { id: cmd.buildingId }, { assignedFlipper: flipper })

      const offerRequest = {
        id: savedOfferRequest.id,
        ...cmd
      }
      await this.publishOfferRequested(cmd, offerRequest, entityManager)

      return offerRequest
    })
  }

  private async doCouchbase (cmd: AddOfferRequestCommand): Promise<AddBuildingOfferCommand & { id: string }> {
    const offerRequest = await this.couchbaseOfferRequestsRepository.add(cmd)
    await this.couchbaseBuildingsRepository.assignBuildingToAgent(cmd.buildingId, cmd.flipperId)
    await this.publishOfferRequested(cmd, offerRequest)

    return offerRequest
  }

  private async publishOfferRequested (
    cmd: AddOfferRequestCommand,
    offerRequest: AddBuildingOfferCommand & { id: string },
    entityManager?: EntityManager
  ) {
    await this.eventBus.publish({
      name: DomainEventCatalog.OFFER_REQUEST__CREATED,
      note: cmd.note,
      userId: cmd.callerId,
      buildingId: cmd.buildingId,
      request: offerRequest
    } as OfferRequestCreated, entityManager)
  }
}

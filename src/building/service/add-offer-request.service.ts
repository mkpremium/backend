import t from 'tcomb'
import { validate } from 'tcomb-validation'
import { InvalidCommand } from '../../infrastructure/invalid-command.error'
import { EventPublisher } from '../../infrastructure/event-bus'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'
import { EntityManager } from 'typeorm'
import { BuildingOfferRequest } from '../repository/building-offer-request.entity'
import { Building } from '../building.entity'
import { Flipper } from '../../flipper/flipper.entity'
import { Caller } from '../../caller/caller.entity'
import { PersonContact } from '../../owner/person-contact.entity'
import { Owner } from '../../owner/owner.entity'

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
  destinationContactId: t.maybe(t.String),
  reporterContactId: t.maybe(t.String),
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
    private eventBus: EventPublisher,
    private entityManager: EntityManager
  ) {
  }

  async addOfferRequest (cmd: AddOfferRequestCommand) {
    this.assertValidCommand(cmd)

    await this.entityManager.transaction(async entityManager => {
      const flipper = await entityManager.findOneByOrFail(Flipper, [
        { id: cmd.flipperId },
        { user: { id: cmd.flipperId } }
      ])
      const savedOfferRequest = await AddOfferRequestService.createOfferRequest(entityManager, cmd, flipper)
      await AddOfferRequestService.updateOwnerAndContactStatus(entityManager, cmd)
      await AddOfferRequestService.assignBuildingToFlipper(entityManager, cmd, flipper)

      const offerRequest = {
        id: savedOfferRequest.id,
        ...(cmd)
      }
      await this.publishOfferRequested(cmd, offerRequest, entityManager)

      return offerRequest
    })
  }

  private static async assignBuildingToFlipper (entityManager: EntityManager, cmd: AddOfferRequestCommand, flipper: Flipper): Promise<void> {
    await entityManager.update(Building, {
      id: cmd.buildingId
    }, { assignedFlipper: flipper, negotiationStatus: 'PENDIENTE' })
  }

  private static async createOfferRequest (entityManager: EntityManager, cmd: AddOfferRequestCommand, flipper: Flipper): Promise<{
    owner: { id: string };
    caller: Caller;
    flipper: Flipper;
    contact: { id: string };
    building: { id: string }
  } & BuildingOfferRequest> {
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
    return savedOfferRequest
  }

  private assertValidCommand (command: AddOfferRequestCommand) {
    const validation = validate(command, AddOfferRequestCommand)
    if (!validation.isValid()) {
      throw new InvalidCommand(validation.errors)
    }
  }

  private static async updateOwnerAndContactStatus (entityManager: EntityManager, cmd: AddOfferRequestCommand): Promise<void> {
    const owner = await entityManager.findOneByOrFail(Owner, { id: cmd.ownerId })
    owner.status = 'VERIFICADO'
    await entityManager.save(owner)
    const personContact = await entityManager.findOneByOrFail(PersonContact, {
      contact: { id: cmd.reporterContactId },
      person: owner.person
    })
    personContact.status = 'GOOD'
    await entityManager.save(personContact)
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

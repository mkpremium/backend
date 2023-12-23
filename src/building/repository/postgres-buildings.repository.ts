import { BuildingsRepository } from './buildings.repository'
import { BuildingNegotiationStatus, BuildingProps, ProposalProps } from '../building'
import { BuildingReadModel, BuildingsReadRepository } from './buildings-read.repository'
import * as TE from 'fp-ts/TaskEither'
import { EntityTarget, Equal, In } from 'typeorm'
import { Building } from '../building.entity'
import { pipe } from 'fp-ts/function'
import { fromPromise } from '../../infrastructure/fp-utils'
import { PostgresRepository } from '../../infrastructure/postgres/postgres-repository'
import { Owner } from '../../owner/owner.entity'
import { Flipper } from '../../flipper/flipper.entity'
import { Proposal } from '../proposal.entity'
import { entityStatusToOldProposal } from './postgres-proposals.repository'
import moment from 'moment'

export class PostgresBuildingsRepository
  extends PostgresRepository<BuildingProps, Building>
  implements BuildingsRepository, BuildingsReadRepository {
  protected relations: {
    assignedFlipper: true,
    featuredOwner: true,
    images: true,
    proposals: true,
  }

  // BuildingsRepository

  assignBuildingToAgent (buildingId: string, agentId: string): Promise<void> {
    return Promise.reject(new Error('Not implemented'))
  }

  pullBuildingsOutOfFreezer (buildingIds: string[]): Promise<void> {
    return Promise.reject(new Error('Not implemented'))
  }

  //   BuildingsReadRepository

  assignedToFlipperAndWithStatus (flipperId: string, status: BuildingNegotiationStatus): TE.TaskEither<Error, BuildingReadModel[]> {
    return pipe(
      fromPromise(this.repository.find(
        {
          where: { assignedFlipper: Equal(flipperId), negotiationStatus: status },
          relations: {
            images: true,
          }
        },
      )),
      TE.chain(buildings => TE.of(buildings.map(mapEntityToReadModel)))
    )
  }

  listAssignedToPropertyAgentOfId (agentId): Promise<BuildingReadModel[]> {
    return Promise.reject(new Error('Not implemented'))
  }

  async listById (ids): Promise<BuildingReadModel[]> {
    return this.repository.find({
      where: {
        id: In(ids)
      },
      relations: {
        images: true,
      }
    }).then(buildings => buildings.map(mapEntityToReadModel))
  }

  async listProposalsForBuilding (buildingId: string): Promise<ProposalProps[]> {
    // TODO: move to proposals repository
    const proposals = await this.entityManager.find(Proposal, {
      where: {
        building: { id: buildingId }
      },
      relations: {
        author: true,
        owner: true,
      }
    })
    return proposals.map(p => ({
      id: p.id,
      buildingId,
      createdBy: p.author.id,
      proposal: p.amount,
      message: p.message,
      notificationStatus: p.notificationStatus,
      notificationSentAt: moment(p.notificationSentAt),
      ownerId: p.owner.id,
      state: entityStatusToOldProposal(p.status),
      notificationEmail: p.notificationEmail,
    }))
  }

  ofCadastreReference (cadastreReference: string): TE.TaskEither<Error, BuildingReadModel | undefined> {
    throw new Error('Not implemented')
  }

  protected getEntityTarget (): EntityTarget<Building> {
    return Building
  }

  protected entityToStruct (entity: Building): BuildingProps {
    return {
      id: entity.id,
      address: entity.address,
      floorArea: entity.floorArea,
      cadastre: entity.publicIdentifier ? { reference: entity.publicIdentifier } : undefined,
      location: entity.location,
      ownerId: entity.featuredOwner?.id,
      negotiationStatus: entity.negotiationStatus,
      lead: entity.lead,
      assignedAgentId: entity.assignedFlipper?.id,
      use: entity.use,
      recentProposal: entity.recentProposal,
      metadata: entity.images
    }
  }

  protected structToEntity (buildingStruct: BuildingProps): Partial<Building> {
    return {
      id: buildingStruct.id,
      address: buildingStruct.address,
      negotiationStatus: buildingStruct.negotiationStatus,
      // TODO: validate lead IDs (contact, owner, and worksheet)
      lead: buildingStruct.lead,
      featuredOwner: { id: buildingStruct.ownerId } as Owner,
      assignedFlipper: { id: buildingStruct.assignedAgentId } as Flipper,
      floorArea: typeof buildingStruct.floorArea === 'string' ? parseFloat(buildingStruct.floorArea) : buildingStruct.floorArea,
      publicIdentifier: buildingStruct.cadastre?.reference,
      location: buildingStruct.location,
      use: buildingStruct.use,
    }
  }
}


export function mapEntityToReadModel (b: Building): BuildingReadModel {
  return {
    id: b.id,
    lead: b.lead,
    negotiationStatus: b.negotiationStatus || undefined,
    address: b.address ? {
      neighborhood: b.address.neighborhood ? b.address.neighborhood : undefined,
      type: b.address.type ? b.address.type : undefined,
      street: b.address.street ? b.address.street : undefined,
      number: b.address.number ? b.address.number : undefined,
      postalCode: b.address.postalCode && b.address.postalCode.number ? {
        number: b.address.postalCode.number
      } : undefined,
      city: b.address.city ? b.address.city : undefined,
      province: b.address.province
    } : undefined,
    metadata: b.images.map(({ id, mimeType, previewUrl }) => ({
      id,
      mimeType,
      previewUrl,
      thumbnailUrl: previewUrl,
    })),
    latestProposal: b.recentProposal,
    floorArea: b.floorArea,
    cadastreReference: b.publicIdentifier,
    stock: null,
    // latestProposal: b.recentProposal?.amount,
    // stock: {
    //   purchase: stock && stock.purchase ? {
    //     reservationAmount: stock.purchase.reservationAmount,
    //     reservationDate: stock.purchase.reservationDate ? moment(stock.purchase.reservationDate).format() : undefined,
    //     transactionAmount: stock.purchase.transactionAmount,
    //     transactionDate: moment(stock.purchase.transactionDate).format()
    //   } : undefined,
    //   sell: stock && stock.sell ? {
    //     reservationAmount: stock.sell.reservationAmount,
    //     reservationDate: stock.sell.reservationDate ? moment(stock.sell.reservationDate).format() : undefined,
    //     transactionAmount: stock.sell.transactionAmount,
    //     transactionDate: moment(stock.sell.transactionDate).format()
    //   } : undefined,
    //   close: stock && stock.close ? {
    //     gain: stock.close.gain,
    //     transactionDate: moment(stock.close.transactionDate).format()
    //   } : undefined
    // },
    // geolocation: location && (location.lat || location.lng) ? {
    //   latitude: location.lat ? location.lat : undefined,
    //   longitude: location.lng ? location.lng : undefined
    // } : undefined,
    // floorArea,
    // usage: use !== null ? use : undefined,
    // owner: (featuredOwner && {
    //   id: featuredOwner.id,
    //   firstName: _.get(featuredOwner, 'firstName'),
    //   name: _.get(featuredOwner, 'fullName'),
    //   contacts: (contacts && contacts.map(({ id, status, type, value }) => ({ id, status, type, value }))),
    //   featuredContact: (featuredOwner && featuredOwner.featuredContact) || undefined
    // }) || undefined,
    // lastMeeting: (lastMeeting && {
    //   dateMeeting: moment(lastMeeting.eventDate).format(),
    //   inPerson: lastMeeting.inPerson
    // }) || undefined,
    // salePrice: salePrice || undefined,
    // totalExpensesAmount: totalExpensesAmount || undefined,
  } as BuildingReadModel
}

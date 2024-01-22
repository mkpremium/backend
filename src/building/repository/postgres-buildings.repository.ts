import { BuildingsRepository } from './buildings.repository'
import { BuildingNegotiationStatus, BuildingProps, ProposalProps } from '../building'
import { BuildingReadModel, BuildingsReadRepository } from './buildings-read.repository'
import * as TE from 'fp-ts/TaskEither'
import { EntityTarget, Equal } from 'typeorm'
import { Building } from '../building.entity'
import { pipe } from 'fp-ts/function'
import { fromPromise } from '../../infrastructure/fp-utils'
import { PostgresRepository } from '../../infrastructure/postgres/postgres-repository'
import { Owner } from '../../owner/owner.entity'
import { Flipper } from '../../flipper/flipper.entity'
import { Proposal } from '../proposal.entity'
import { entityStatusToOldProposal } from './postgres-proposals.repository'
import moment from 'moment'
import { BuildingOwnerProps } from '../../owner/repository/owner.repository'
import { selectBuildingOwner } from '../service/owner-selection.policy'

import { toOwnerInBuildingRead } from './utils'

export class PostgresBuildingsRepository
  extends PostgresRepository<BuildingProps, Building>
  implements BuildingsRepository, BuildingsReadRepository {
  protected relations = {
    assignedFlipper: true,
    featuredOwner: true,
    documents: true,
    proposals: true,
  }
  //   BuildingsReadRepository

  assignedToFlipperAndWithStatus (flipperId: string, status: BuildingNegotiationStatus): TE.TaskEither<Error, BuildingReadModel[]> {
    return pipe(
      fromPromise(this.repository.find(
        {
          where: { assignedFlipper: Equal(flipperId), negotiationStatus: status },
          relations: {
            documents: true,
          }
        },
      )),
      TE.chain(buildings => TE.of(buildings.map(b => buildingEntityToReadModel(b))))
    )
  }

  async listProposalsForBuilding (buildingId: string): Promise<ProposalProps[]> {
    const proposals = await this.entityManager.find(Proposal, {
      where: { building: Equal(buildingId) },
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
  protected getEntityTarget (): EntityTarget<Building> {
    return Building
  }

  protected entityToStruct (entity: Building): BuildingProps {
    return mapBuildingEntityToStruct(entity)
  }

  protected structToEntity (buildingStruct: BuildingProps): Partial<Building> {
    return mapBuildingStructToEntity(buildingStruct)
  }
}

export function mapBuildingStructToEntity (buildingStruct: BuildingProps) {
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

export function mapBuildingEntityToStruct (entity: Building): BuildingProps {
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
    recentProposal: entity.recentProposal ? {
      proposal: entity.recentProposal.amount,
      createdAt: entity.recentProposal.createdAt,
    } : undefined,
    metadata: entity.documents
  }
}

interface BuildingReadModelData {
  lastOfferCreatedAt?: Date
  owners?: (BuildingOwnerProps & { buildingId: string })[]
}

export function buildingEntityToReadModel (
  b: Building, extra: BuildingReadModelData = {}): BuildingReadModel {
  const owner = extra.owners ? selectBuildingOwner(
    extra.owners!, b.featuredOwner?.id) : undefined // TODO: pass last meeting
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
    owner: toOwnerInBuildingRead(owner),
    metadata: b.documents.map(({ id, mimeType, previewUrl }) => ({
      id,
      mimeType,
      previewUrl,
      thumbnailUrl: previewUrl,
    })),
    latestProposal: b.recentProposal,
    floorArea: b.floorArea,
    cadastreReference: b.publicIdentifier,
    lastMeeting: (extra.lastOfferCreatedAt && {
      dateMeeting: moment(extra.lastOfferCreatedAt).format(),
      inPerson: false,
    }) || undefined,
    geolocation: (b.location?.lat && b.location?.lng) ? {
      latitude: b.location.lat,
      longitude: b.location.lng
    } : undefined,
    usage: b.use,
    stock: null,
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
    // salePrice: salePrice || undefined,
    // totalExpensesAmount: totalExpensesAmount || undefined,
  } as BuildingReadModel
}

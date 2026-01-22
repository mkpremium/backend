import { BuildingsRepository } from './buildings.repository'
import { BuildingProps, ProposalProps } from '../building'
import { BuildingReadModel, BuildingsReadRepository } from './buildings-read.repository'
import { EntityTarget, Equal } from 'typeorm'
import { Building } from '../building.entity'
import { PostgresRepository } from '../../infrastructure/postgres/postgres-repository'
import { Owner } from '../../owner/owner.entity'
import { Flipper } from '../../flipper/flipper.entity'
import { Proposal } from '../proposal.entity'
import { entityStatusToOldProposal } from './postgres-proposals.repository'
import moment from 'moment'
import { BuildingOwnerProps } from '../../owner/repository/owner.repository'
import { selectBuildingOwner } from '../service/owner-selection.policy'

import { toOwnerInBuildingRead } from './utils'
import { BuildingLead } from '../building-lead.entity'
import { Contact } from '../../contacts/contact.entity'
import { Worksheet } from '../../worksheet/worksheet.entity'

export class PostgresBuildingsRepository
  extends PostgresRepository<BuildingProps, Building>
  implements BuildingsRepository, BuildingsReadRepository {
  protected relations = {
    assignedFlipper: true,
    featuredOwner: true,
    documents: true,
    proposals: true,
    addressEntity: true,
    leadEntity: true,
    locationEntity: true
  }
  //   BuildingsReadRepository

  async listProposalsForBuilding (buildingId: string): Promise<ProposalProps[]> {
    const proposals = await this.entityManager.find(Proposal, {
      where: { building: Equal(buildingId) },
      relations: {
        author: true,
        owner: true
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
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
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
    address: buildingStruct.address
      ? {
        ...buildingStruct.address,
        postalCode: { number: buildingStruct.address.postalCode?.number }
      }
      : undefined,
    negotiationStatus: buildingStruct.negotiationStatus,
    // TODO: validate lead IDs (contact, owner, and worksheet)
    lead: buildingStruct.lead
      ? {
        owner: { id: buildingStruct.lead.ownerId } as any,
        contact: { id: buildingStruct.lead.contactId } as any,
        worksheet: { id: buildingStruct.lead.worksheetId } as any,
        capturedAt: buildingStruct.lead.capturedAt
      } as any
      : undefined,
    featuredOwner: { id: buildingStruct.ownerId } as Owner,
    assignedFlipper: { id: buildingStruct.assignedAgentId } as Flipper,
    floorArea: typeof buildingStruct.floorArea === 'string' ? parseFloat(buildingStruct.floorArea) : buildingStruct.floorArea,
    publicIdentifier: buildingStruct.cadastre?.reference,
    location: buildingStruct.location as any,
    use: buildingStruct.use
  }
}

export function mapBuildingEntityToStruct (entity: Building): BuildingProps {
  return {
    id: entity.id,
    address: entity.addressEntity && {
      street: entity.addressEntity.street,
      number: entity.addressEntity.number,
      fullAddress: entity.addressEntity.fullAddress,
      postalCode: entity.addressEntity.postalCode
        ? { number: entity.addressEntity.postalCode }
        : undefined,
      postalCodeVerified: entity.addressEntity.postalCodeVerified,
      city: entity.addressEntity.city,
      province: entity.addressEntity.province,
      neighborhood: entity.addressEntity.neighborhood,
      type: entity.addressEntity.type
    },
    floorArea: isNaN(entity.floorArea) ? null : entity.floorArea,
    cadastre: entity.publicIdentifier ? { reference: entity.publicIdentifier } : undefined,
    location: entity.locationEntity,
    ownerId: entity.featuredOwner?.id,
    negotiationStatus: entity.negotiationStatus,
    lead: entity.leadEntity && {
      worksheetId: entity.leadEntity.worksheet.id,
      ownerId: entity.leadEntity.owner.id,
      contactId: entity.leadEntity.contact.id,
      capturedAt: entity.leadEntity.capturedAt
    },
    assignedAgentId: entity.assignedFlipper?.id,
    use: entity.use,
    recentProposal: entity.recentProposal
      ? {
        id: entity.recentProposal.id,
        proposal: entity.recentProposal.amount,
        createdAt: entity.recentProposal.createdAt
      }
      : undefined,
    metadata: entity.documents.map(
      ({ id, name, mimeType, previewUrl, privateUrl }) =>
        ({ id, name, mimeType, previewUrl, url: privateUrl }))
  }
}

interface BuildingReadModelData {
  lastOfferCreatedAt?: Date
  owners?: (BuildingOwnerProps & { buildingId: string })[]
}

export function buildingEntityToReadModel (
  b: Building, extra: BuildingReadModelData = {}): BuildingReadModel {
  const owner = extra.owners
    ? selectBuildingOwner(
    extra.owners!, b.featuredOwner?.id)
    : undefined // TODO: pass last meeting
  return {
    id: b.id,
    lead: b.leadEntity
      ? {
        worksheetId: b.leadEntity.worksheet?.id ? b.leadEntity.worksheet?.id : undefined,
        ownerId: b.leadEntity.owner?.id ? b.leadEntity.owner?.id : undefined,
        contactId: b.leadEntity.contact?.id ? b.leadEntity.contact?.id : undefined,
        capturedAt: b.leadEntity.capturedAt ? b.leadEntity.capturedAt : undefined
      }
      : null,
    negotiationStatus: b.negotiationStatus || undefined,
    address: b.addressEntity
      ? {
        neighborhood: b.addressEntity.neighborhood ? b.addressEntity.neighborhood : undefined,
        type: b.addressEntity.type ? b.addressEntity.type : undefined,
        street: b.addressEntity.street ? b.addressEntity.street : undefined,
        number: b.addressEntity.number ? b.addressEntity.number : undefined,
        postalCode: b.addressEntity.postalCode ? { number: b.addressEntity.postalCode } : undefined,
        city: b.addressEntity.city ? b.addressEntity.city : undefined,
        province: b.addressEntity.province
      }
      : undefined,
    owner: toOwnerInBuildingRead(owner),
    metadata: b.documents.map(({ id, mimeType, previewUrl }) => ({
      id,
      mimeType,
      previewUrl,
      thumbnailUrl: previewUrl
    })),
    latestProposal: b.recentProposal,
    floorArea: isNaN(b.floorArea) ? undefined : b.floorArea,
    cadastreReference: b.publicIdentifier,
    lastMeeting: (extra.lastOfferCreatedAt && {
      dateMeeting: moment(extra.lastOfferCreatedAt).format(),
      inPerson: false
    }) || undefined,
    geolocation: (b.locationEntity?.lat && b.locationEntity?.lng)
      ? {
        latitude: b.locationEntity.lat,
        longitude: b.locationEntity.lng
      }
      : undefined,
    usage: b.use,
    stock: b.stock
      ? {
        purchase: b.stock.purchaseTransaction,
        sell: b.stock.sellTransaction,
        close: b.stock.closeEntity
      }
      : undefined
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

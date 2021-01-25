import t from 'tcomb'
import uuid from 'uuid/v4'
import { Address, SimpleAddress, SimplePhoneNumber } from '../types/common'
import { BuildingStateEnum } from '../types/enums'

const buildingEntitiesDefaultStatus = 'SIN DATOS'
const buildingEntitiesStatus = {
  2: 'VACIO',
  4: 'INDEFINIDO',
  5: 'A TERMINO',
  6: 'OKUPAS'
}

export const BuildingCadastre = t.struct({
  reference: t.String,
  address: t.String
}, 'Cadastre')

export const BuildingLocation = t.struct({
  lat: t.maybe(t.Number),
  lng: t.maybe(t.Number)
}, 'Location')

const Elements = t.struct({
  number: t.Number,
  average: t.Number,
  commons: t.Number
}, 'Elements')

const BuildingOwner = t.struct(
  {
    name: t.maybe(t.String),
    address: SimpleAddress,
    phones: t.list(SimplePhoneNumber)
  },
  {
    name: 'BuildingOwner',
    defaultProps: {
      phones: []
    }
  }
)

const BuildingProposalStatus = {
  DEAL: 'aceptada',
  SENT: 'enviada',
  PENDING: 'pendiente'
}

export const BuildingProposal = t.struct(
  {
    id: t.String,
    ownerId: t.maybe(t.String),
    buildingId: t.String,
    accepted: t.Boolean,
    createdAt: t.Date,
    createdBy: t.String,
    updatedAt: t.maybe(t.Date),
    updateBy: t.maybe(t.String),

    aspiration: t.maybe(t.Number),
    proposal: t.maybe(t.Number),
    state: t.enums.of(Object.values(BuildingProposalStatus)),

    _documentType: t.enums.of([ 'building-proposal' ])
  },
  {
    name: 'BuildingProposal',
    defaultProps: {
      state: BuildingProposalStatus.PENDING,
      accepted: false,
      get id () {
        return uuid()
      },
      get createdAt () {
        return new Date()
      },
      _documentType: 'building-proposal'
    }
  }
)

const BuildingEntity = t.struct(
  {
    id: t.String,
    status: t.enums.of(Object.values(buildingEntitiesStatus).concat(buildingEntitiesDefaultStatus)),
    name: t.maybe(t.String),
    type: t.maybe(t.String),
    surface: t.Number,
    rent: t.maybe(t.Number),
    expiration: t.maybe(t.Date),

    plant: t.maybe(t.String),
    door: t.maybe(t.String),

    _migrateBuildingId: t.maybe(t.String),
    _migrateIdStatus: t.maybe(t.String)
  },
  {
    name: 'BuildingEntity',
    defaultProps: {
      status: buildingEntitiesDefaultStatus,
      surface: 0,
      rent: 0,
      get id () {
        return uuid()
      },
      get createdBy () {
        return new Date()
      }
    }
  }
)

export const BuildingMetadataPreview = t.struct({
  id: t.String,
  name: t.maybe(t.String),
  mimeType: t.maybe(t.String),
  previewUrl: t.maybe(t.String)
})

export const buildingNegotiationStatus = [
  'PENDIENTE',
  'PROPUESTA ENVIADA',
  'COMPRADO',
  'VENDIDO',
  'NO VENDE',
  'DESCARTADO',
  'YA VENDIO'
]

export const NegotiationStatus = t.enums.of(buildingNegotiationStatus)
export const Building = t.struct(
  {
    id: t.String,
    address: Address,
    buildingType: t.BuildingType,
    cadastre: t.maybe(BuildingCadastre),
    floorArea: t.union([ t.Number, t.String ]),
    landArea: t.union([ t.Number, t.String ]),
    roofArea: t.union([ t.Number, t.String ]),
    coefficient: t.union([ t.Number, t.String ]),
    use: t.maybe(t.String),
    propertyType: t.maybe(t.String),
    buildingDate: t.union([ t.Number, t.String ]),
    location: BuildingLocation,
    elements: t.maybe(Elements),
    entities: t.list(BuildingEntity),
    ownerId: t.maybe(t.String),
    owner: t.maybe(BuildingOwner),
    state: BuildingStateEnum,
    proposals: t.list(t.String),
    recentProposal: t.maybe(BuildingProposal),
    negotiationStatus: NegotiationStatus,
    assignedAgentId: t.maybe(t.String),
    salePrice: t.maybe(t.Number),
    isTest: t.maybe(t.Boolean),

    metadata: t.list(BuildingMetadataPreview),

    Id_Estado: t.maybe(t.String), // Use to sync firebase informadores

    _migrateId: t.maybe(t.String),
    _relatedTo: t.maybe(t.String),
    _documentType: t.String
  },
  {
    name: 'Building',
    defaultProps: {
      get id () {
        return uuid()
      },
      floorArea: 0,
      landArea: 0,
      roofArea: 0,
      coefficient: 0,
      buildingDate: 0,
      proposals: [],
      metadata: [],
      entities: [],
      Id_Estado: null,
      buildingType: 'VERTICAL',
      state: 'BUENO',
      negotiationStatus: 'PENDIENTE',
      _documentType: 'building'
    }
  }
)

Building.prototype.changeNegotiationStatus = function (newStatus) {
  return Building.update(this, {
    negotiationStatus: {
      $set: newStatus
    }
  })
}

Building.prototype.withFeaturedOwner = function (ownerId) {
  return Building.update(this, {
    ownerId: {
      $set: ownerId
    }
  })
}

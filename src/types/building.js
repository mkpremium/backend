import t from 'tcomb';
import uuid from 'uuid/v4';

/**
 * @swagger
 * definitions:
 *   Cadastre:
 *     properties:
 *       refenrece:
 *         type: string
 *       address:
 *         type: string
 */
t.Cadastre = t.struct({
  reference: t.String,
  address: t.String
}, 'Cadastre');

/**
 * @swagger
 * definitions:
 *   Location:
 *     properties:
 *       lat:
 *         type: number
 *       lng:
 *         type: number
 */
t.Location = t.struct({
  lat: t.Number,
  lng: t.Number
}, 'Location');

/**
 * @swagger
 * definitions:
 *   Elements:
 *     properties:
 *       number:
 *         type: number
 *       average:
 *         type: number
 *       commons:
 *         type: number
 */
t.Elements = t.struct({
  number: t.Number,
  average: t.Number,
  commons: t.Number
}, 'Elements');

/**
 * @swagger
 * definitions:
 *   BuildingOwner:
 *     properties:
 *       name:
 *         type: number
 *       address:
 *         $ref: "#/definitions/SimpleAddress"
 *       phones:
 *          $ref: "#/definitions/SimplePhoneNumber"
 */
t.BuildingOwner = t.struct(
  {
    name: t.String,
    address: t.SimpleAddress,
    phones: t.list(t.SimplePhoneNumber)
  },
  {
    name: 'BuildingOwner',
    defaultProps: {
      phones: []
    }
  }
);

const BuildingProposalStatus = {
  DEAL: 'aceptada',
  SENT: 'enviada',
  PENDING: 'pendiente'
};

t.BuildingProposalStatus = t.enums.of(Object.values(BuildingProposalStatus));

/**
 * @swagger
 * definitions:
 *   BuildingProposalBody:
 *     properties:
 *       ownerId:
 *         type: string
 *         format: uuid/v4
 *         description: Id del Propietario a quien se realizó la propuesta
 *       state:
 *         type: string
 *         enum: [aceptada, enviada, pendiente]
 *       aspiration:
 *         type: number
 *       proposal:
 *         type: number
 *   BuildingProposal:
 *     properties:
 *       id:
 *         type: string
 *         format: uuid/v4 (asignado por el sistema)
 *       ownerId:
 *         type: string
 *         format: uuid/v4
 *         description: Id del Propietario a quien se realizó la propuesta
 *       buildingId:
 *         type: string
 *         format: uuid/v4
 *         description: Id del edificio (asignado por el sistema)
 *       createdBy:
 *         type: string
 *         format: uuid/v4
 *         description: Id del operator que realizo la propuesta  (asignado por el sistema)
 *       createdAt:
 *         type: string
 *         description: Fecha de creación de la propuesta *  (asignado por el sistema)
 *       updatedBy:
 *         type: string
 *         format: uuid/v4
 *         description: Id del operator que actualizó  (asignado por el sistema)
 *       updatedAt:
 *         type: string
 *         description: Fecha de actualización de la propuesta  (asignado por el sistema)
 *       state:
 *         type: string
 *         enum: [aceptada, enviada, pendiente]
 *       aspiration:
 *         type: number
 *       proposal:
 *         type: number
 */
t.BuildingProposal = t.struct(
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
    state: t.BuildingProposalStatus,

    _documentType: t.enums.of(['building-proposal'])
  },
  {
    name: 'BuildingProposal',
    defaultProps: {
      state: BuildingProposalStatus.PENDING,
      accepted: false,
      get id() {
        return uuid();
      },
      get createdAt() {
        return new Date();
      },
      _documentType: 'building-proposal'
    }
  }
);

const BuildingEntityStatus = {
  EMPTY: 'vacio',
  UNDEFINED: 'indefinido',
  SALE: 'venta',
  RENT: 'arriendo',
  NO_SALE: 'no vende',
  OKUPAS: 'okupas'
};

t.BuildingEntityStatus = t.enums.of(Object.values(BuildingEntityStatus));

/**
 * @swagger
 * definitions:
 *   BuildingEntityBody:
 *     properties:
 *       status:
 *         type: string
 *         enum: [vacio, indefinido, venta arriendo, no vende, okupas]
 *         description: "Estado de la situación arrendataria"
 *       name:
 *         type: string
 *         description: Nombre o identificador
 *       type:
 *         type: string
 *       surface:
 *         type: number
 *         description: Area en metros
 *       rent:
 *         type: number
 *       expiration:
 *         type: string
 *         format: YYYY-MM-DDTHH:MM:SSZ
 *   BuildingEntity:
 *     properties:
 *       id:
 *         type: string
 *         format: uuid/v4
 *       status:
 *         type: string
 *         enum: [vacio, indefinido, venta arriendo, no vende, okupas]
 *         description: "Estado de la situación arrendataria"
 *       name:
 *         type: string
 *         description: Nombre o identificador
 *       type:
 *         type: string
 *       surface:
 *         type: number
 *         description: Area en metros
 *       rent:
 *         type: number
 *       expiration:
 *         type: string
 *         format: YYYY-MM-DDTHH:MM:SSZ
 */
t.BuildingEntity = t.struct(
  {
    id: t.String,
    status: t.BuildingEntityStatus,
    name: t.maybe(t.String),
    type: t.String,
    surface: t.Number,
    rent: t.Number,
    expiration: t.maybe(t.Date),

    _migrateBuildingId: t.maybe(t.String),
    _migrateIdStatus: t.maybe(t.String)
  },
  {
    name: 'BuildingEntity',
    defaultProps: {
      status: BuildingEntityStatus.UNDEFINED,
      surface: 0,
      rent: 0,
      get id() {
        return uuid();
      },
      get createdBy() {
        return new Date();
      }
    }
  }
);

/**
 * @swagger
 * definitions:
 *   BuildingMetadataPreview:
 *     properties:
 *         id:
 *           type: string
 *           format: uuid/v4
 *         name:
 *           type: string
 *           description: Nombre a mostrar
 *         previewUrl:
 *           type: string
 *           description: "Url publica de amazon con un thumbnail del archivo (images, pdf)"
 */
t.BuildingMetadataPreview = t.struct({
  id: t.String,
  name: t.maybe(t.String),
  previewUrl: t.maybe(t.String)
});

/**
 * @swagger
 * definitions:
 *   Building:
 *     properties:
 *       id:
 *         type: string
 *         format: uuid/v4
 *       address:
 *         $ref: "#/definitions/Address"
 *       buildingType:
 *         type: string
 *         enum: [VERTICAL, HORIZONTAL]
 *       cadastre:
 *         $ref: "#/definitions/Cadastre"
 *       floorArea:
 *         type: number
 *       landArea:
 *         type: number
 *       roofArea:
 *         type: number
 *       coefficient:
 *         type: number
 *       use:
 *         type: string
 *       propertyType:
 *         type: string
 *       buildingDate:
 *         type: number
 *       location:
 *         $ref: "#/definitions/Location"
 *       elements:
 *         $ref: "#/definitions/Elements"
 *       ownerId:
 *         type: string
 *       owner:
 *         $ref: "#/definitions/BuildingOwner"
 *       state:
 *         type: string
 *         enum: [BUENO, MALO]
 *       metadata:
 *         type: array
 *         items:
 *           $ref: "#/definitions/BuildingMetadataPreview"
 */
t.Building = t.struct(
  {
    id: t.String,
    address: t.Address,
    buildingType: t.BuildingType,
    cadastre: t.maybe(t.Cadastre),
    floorArea: t.Number,
    landArea: t.Number,
    roofArea: t.Number,
    coefficient: t.Number,
    use: t.maybe(t.String), // FIXME: define this as a t.enums
    propertyType: t.maybe(t.String), // FIXME: define this as a t.enums
    buildingDate: t.Number,
    location: t.Location,
    elements: t.Elements,
    entities: t.list(t.BuildingEntity),
    ownerId: t.maybe(t.String),
    owner: t.BuildingOwner, // TODO: move to owners collection
    state: t.BuildingState,
    proposals: t.list(t.String),
    recentProposal: t.maybe(t.BuildingProposal),

    metadata: t.list(t.BuildingMetadataPreview),

    Id_Estado: t.maybe(t.String), // Use to sync firebase informadores

    _migrateId: t.String,
    _documentType: t.String
  },
  {
    name: 'Building',
    defaultProps: {
      get id() {
        return uuid();
      },
      floorArea: 0,
      landArea: 0,
      roofArea: 0,
      coefficient: 0,
      buildingDate: 0,
      proposals: [],
      metadata: [],
      entities: [],
      _migrateId: [],
      Id_Estado: null,
      _documentType: 'building'
    }
  }
);

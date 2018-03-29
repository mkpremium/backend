import t from 'tcomb';

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
    ownerId: t.maybe(t.String),
    owner: t.BuildingOwner, // TODO: move to owners collection
    state: t.BuildingState,

    _migrateId: t.String,

    _documentType: t.String
  },
  {
    name: 'Building',
    defaultProps: {
      floorArea: 0,
      landArea: 0,
      roofArea: 0,
      coefficient: 0,
      buildingDate: 0,
      _migrateId: [],
      _documentType: 'building'
    }
  }
);

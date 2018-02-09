import t from 'tcomb';
import find from 'lodash/find';

/**
 * @swagger
 * definitions:
 *   Owner:
 *     properties:
 *       id:
 *         type: string
 *         format: uuid/v4
 *       person:
 *         $ref: "#/definitions/Person"
 *       building:
 *         $ref: "#/definitions/Building"
 *       note:
 *         type: string
 *       type:
 *         type: string
 */
t.Owner = t.struct(
  {
    id: t.maybe(t.String),
    type: t.OwnerType,
    status: t.maybe(t.OwnerStatus),

    personId: t.String,
    buildingId: t.String,

    note: t.maybe(t.String),

    _migrateId: t.list(t.String),
    _relatedTo: t.maybe(t.String),
    _documentType: t.String
  },
  {
    name: 'Owner',
    defaultProps: {
      type: 'NINGUNO',

      _documentType: 'owner',
      _migrateId: []
    }
  }
);

/**
 * @swagger
 * definitions:
 *   OwnerUpdate:
 *     properties:
 *       type:
 *         type: string
 *         description: Tipo de propietario
 *       status:
 *         type: string
 *       note:
 *         type: string
 *       buildingId:
 *         type: string
 *         format: uuid/v4
 *         description: Id del edificio relacionado
 *       personId:
 *         type: string
 *         format: uuid/v4
 *         description: Id de la persona relacionada
 */
t.OwnerUpdate = t.struct({
  type: t.maybe(t.OwnerType),
  status: t.maybe(t.OwnerStatus),
  note: t.maybe(t.String),
  buildingId: t.maybe(t.String),
  personId: t.maybe(t.String)
}, 'OwnerUpdate');

/**
 * @swagger
 * definitions:
 *   Person:
 *     properties:
 *       id:
 *         type: string
 *         format: uuid/v4
 *       name:
 *         type: string
 *         description: Nombre de organización
 *       firstName:
 *         type: string
 *       firstSurname:
 *         type: string
 *       secondSurname:
 *         type: string
 *       documentNumber:
 *         type: string
 *       contacts:
 *         type: array
 *         items:
 *           $ref: "#/definitions/TypedContactInfo"
 *       birthDate:
 *         type: string
 *         format: "DD-MM-YYYY"
 *
 */
t.Person = t.struct(
  {
    id: t.maybe(t.String),
    name: t.String,
    firstName: t.maybe(t.String),
    firstSurname: t.maybe(t.String),
    secondSurname: t.maybe(t.String),
    documentNumber: t.maybe(t.String), // Note: unique

    contacts: t.list(t.TypedContactInfo),
    addresses: t.list(t.SimpleAddress),
    birthDate: t.maybe(t.Date),
    gender: t.Gender,

    personType: t.PersonType,

    _documentType: t.String
  },
  {
    name: 'Person',
    defaultProps: {
      contacts: [],
      addresses: [],
      gender: 'NINGUNO',
      _documentType: 'person'
    }
  }
);

t.Person.prototype.findContact = function({value}) {
  return find(this.contacts, {value});
};

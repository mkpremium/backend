import t from 'tcomb';
import find from 'lodash/find';

/**
 * @swagger
 * definitions:
 *   Contact:
 *     properties:
 *       id:
 *         type: string
 *         format: uuid/v4
 *       person:
 *         $ref: "#/definitions/Person"
 *       relatedBuilding:
 *         $ref: "#/definitions/Building"
 */
t.Owner = t.struct(
  {
    id: t.maybe(t.String),
    type: t.OwnerType,
    status: t.maybe(t.OwnerStatus),

    personId: t.String,

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
 *       status:
 *         type: string
 *       note:
 *         type: string
 */
t.OwnerUpdate = t.struct({
  status: t.maybe(t.OwnerStatus),
  note: t.maybe(t.String)
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

import t from 'tcomb';
import find from 'lodash/find';

/**
 * @swagger
 * definitions:
 *   OwnerBody:
 *     required:
 *       - person
 *     properties:
 *       person:
 *         $ref: "#/definitions/Person"
 *       building:
 *         $ref: "#/definitions/Building"
 *       note:
 *         type: string
 *       type:
 *         type: string
 *       status:
 *         type: string
 *         enum: [NO_VERIFICADO, VERIFICADO, ERRONEO]
 */

/**
 * @swagger
 * definitions:
 *   Owner:
 *     required:
 *       - person
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
 *       status:
 *         type: string
 *         enum: [NO_VERIFICADO, VERIFICADO, ERRONEO]
 */
t.Owner = t.struct(
  {
    id: t.maybe(t.String),
    type: t.OwnerType,
    verified: t.Boolean,
    status: t.OwnerStatus,

    person: t.Object,
    personId: t.maybe(t.String), // FIXME: this should be removed
    buildingId: t.maybe(t.String), // FIXME: this is required

    note: t.maybe(t.String),

    _migrateId: t.list(t.String),
    _relatedTo: t.maybe(t.String),
    _documentType: t.String
  },
  {
    name: 'Owner',
    defaultProps: {
      type: 'NINGUNO',
      verified: false,
      status: 'NO_VERIFICADO',
      _documentType: 'owner',
      _migrateId: [],
      _relatedTo: ''
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
  person: t.maybe(t.Object)
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

t.Person.prototype.findContact = function(id) {
  return find(this.contacts, {id});
};

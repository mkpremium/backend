import t from 'tcomb';
import _find from 'lodash/find';
import _get from 'lodash/get';
import {OwnerStatus, OwnerType} from './enums';

/**
 * @swagger
 * definitions:
 *   OwnerBody:
 *     required:
 *       - status
 *     properties:
 *       person:
 *         $ref: "#/definitions/PersonBody"
 *       personId:
 *         type: string
 *         format: uuid/v4
 *       buildingId:
 *         type: string
 *         format: uuid/v4
 *       note:
 *         type: string
 *       type:
 *         type: string
 *       status:
 *         type: string
 *         enum: [NO_VERIFICADO, VERIFICADO, ERRONEO]
 */
t.OwnerBody = t.struct(
  {
    type: t.maybe(t.OwnerType),
    verified: t.maybe(t.Boolean),
    status: t.OwnerStatus,
    person: t.maybe(t.Object),
    personId: t.maybe(t.String),
    buildingId: t.maybe(t.String),
    note: t.maybe(t.String)
  },
  {
    name: 'OwnerBody',
    defaultProps: {
      type: 'NINGUNO',
      verified: false,
      status: 'NO_VERIFICADO',
      personId: '',
      person: {}
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
 *   PersonBody:
 *     properties:
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

t.Person.prototype.findFirstGoodContact = function() {
  const contact = _find(this.contacts, {status: 'GOOD'}, {});
  return _get(contact, 'value');
};

t.Person.prototype.findContactById = function(id) {
  return _find(this.contacts, {id});
};

t.Person.prototype.findContactValueById = function(id) {
  const contact = this.findContactById(id);
  return contact ? contact.value : null;
};

t.Person.prototype.fullName = function() {
  return `${this.name}`.trim();
};

t.Person.prototype.contactValueExists = function(value) {
  return !!_find(this.contacts, {value});
};

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
 *       personId:
 *         type: string
 *         format: uuid/v4
 *       buildingId:
 *         type: string
 *         format: uuid/v4
 *       note:
 *         type: string
 *       type:
 *         type: string
 *       verified:
 *         type: boolean
 *         description: "Verifica la información por un operador humano"
 *       status:
 *         type: string
 *         enum: [NO_VERIFICADO, VERIFICADO, NO_SALE, ERRONEO]
 */
t.OwnerConfirmed = t.struct({
  value: t.Boolean,
  confirmedBy: t.maybe(t.String),
  confirmedAt: t.maybe(t.Date)
}, 'confirmed');
t.Owner = t.struct(
  {
    id: t.maybe(t.String),
    type: t.OwnerType,
    status: t.OwnerStatus,
    personId: t.maybe(t.String),
    buildingId: t.maybe(t.String),

    note: t.maybe(t.String),

    confirmedByOperator: t.OwnerConfirmed,

    _migrateId: t.list(t.String),
    _relatedTo: t.maybe(t.String),
    _documentType: t.String
  },
  {
    name: 'Owner',
    defaultProps: {
      confirmedByOperator: {
        value: false
      },
      type: 'NINGUNO',
      status: 'NO_VERIFICADO',
      _documentType: 'owner',
      _migrateId: [],
      _relatedTo: ''
    }
  }
);

t.Owner.prototype.fullName = function() {
  if (this.person) {
    return this.person.fullName();
  }
};

t.Owner.prototype.findFirstGoodContact = function() {
  if (this.person) {
    return this.person.prototype.findFirstGoodContact();
  }
};

t.Owner.prototype.verifyOwner = function(confirmedBy, value = true) {
  return t.update(this, {
    $merge: {
      confirmedByOperator: {
        value,
        confirmedBy,
        confirmedAt: new Date()
      }
    }
  });
};

t.Owner.prototype.isPrimaryVerified = function() {
  return isPrimaryVerified(this);
};

export function isPrimaryVerified(data) {
  const owner = t.Owner(data);
  return owner.confirmedByOperator.value &&
    owner.status === OwnerStatus.VERIFIED &&
    owner.type === OwnerType.PRINCIPAL;
}

export function isInvalidVerified(data) {
  const owner = t.Owner(data);
  return owner.confirmedByOperator.value &&
    owner.status === OwnerStatus.ERROR;
}

export function ownerNoSale(data) {
  const owner = t.Owner(data);
  return owner.confirmedByOperator.value &&
    owner.status === OwnerStatus.NO_SALE;
}

export function ownerAlreadySold(data) {
  const owner = t.Owner(data);
  return owner.confirmedByOperator.value &&
    owner.status === OwnerStatus.ALREADY_SOLD;
}

export function isAllowedChangeState(data) {
  const owner = t.Owner(data);
  return [OwnerStatus.ALREADY_SOLD, OwnerStatus.NO_SALE, OwnerStatus.VERIFIED].indexOf(owner.status) !== -1;
}

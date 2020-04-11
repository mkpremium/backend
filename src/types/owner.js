import fromJSON from 'tcomb/lib/fromJSON'
import t from 'tcomb'
import _find from 'lodash/find'
import _get from 'lodash/get'
import _every from 'lodash/every'
import { OwnerStatus, OwnerStatusEnum, OwnerType } from './enums'
import _ from 'lodash'

export const OwnerBusiness = t.struct({
  meetingWithOperatorId: t.String,
  status: t.String
}, 'OwnerBusiness')

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
export const OwnerBody = t.OwnerBody = t.struct(
  {
    type: t.maybe(t.OwnerType),
    verified: t.maybe(t.Boolean),
    status: OwnerStatusEnum,
    person: t.maybe(t.Object),
    personId: t.maybe(t.String),
    buildingId: t.maybe(t.String),
    note: t.maybe(t.String),
    business: t.maybe(OwnerBusiness)
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
)

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
 *       confirmed:
 *         type: boolean
 */
t.OwnerUpdate = t.struct({
  type: t.maybe(t.OwnerType),
  status: t.maybe(t.OwnerStatus),
  business: t.maybe(OwnerBusiness),
  note: t.maybe(t.String),
  buildingId: t.maybe(t.String),
  person: t.maybe(t.Object),
  confirmed: t.maybe(t.Boolean)
}, 'OwnerUpdate')

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
export const Person = t.Person = t.struct(
  {
    id: t.maybe(t.String),
    name: t.String,
    firstName: t.maybe(t.String),
    firstSurname: t.maybe(t.String),
    secondSurname: t.maybe(t.String),
    documentNumber: t.maybe(t.String), // Note: make unique one day

    contacts: t.list(t.TypedContactInfo),
    addresses: t.list(t.SimpleAddress),
    _address: t.maybe(t.SimpleAddress),
    birthDate: t.maybe(t.Date),
    birthYear: t.maybe(t.Number),
    gender: t.maybe(t.Gender),

    personType: t.PersonType,

    _documentType: t.String,

    _migrateId: t.maybe(t.String),
    _migrateOwnerId: t.maybe(t.String),
    _relatedTo: t.maybe(t.String),
    _secondMigration: t.maybe(t.Boolean),
    _verifiedOwnerMigrateId: t.maybe(t.String)
  },
  {
    name: 'Person',
    defaultProps: {
      contacts: [],
      addresses: [],
      gender: 'NINGUNO',
      _documentType: 'person',
      personType: 'NATURAL',
      _secondMigration: false,
      birthDate: null,
      birthYear: null,
      _migrateId: null,
      _address: null,
      _verifiedOwnerMigrateId: null
    }
  }
)

t.Person.prototype.findFirstGoodContact = function () {
  const contact = _find(this.contacts, { status: 'GOOD' }, {})
  return _get(contact, 'value')
}

t.Person.prototype.findContactById = function (id) {
  return _find(this.contacts, { id })
}

t.Person.prototype.findContactValueById = function (id) {
  const contact = this.findContactById(id)
  return contact ? contact.value : null
}

t.Person.prototype.fullName = function () {
  return `${this.name}`.trim()
}

t.Person.prototype.contactValueExists = function (value) {
  return !!_find(this.contacts, { value })
}

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
}, 'confirmed')

export const Owner = t.struct(
  {
    id: t.maybe(t.String),
    type: t.OwnerType,
    status: t.OwnerStatus,
    personId: t.maybe(t.String),
    buildingId: t.maybe(t.String),
    business: t.maybe(OwnerBusiness),
    name: t.maybe(t.String),

    note: t.maybe(t.String),

    confirmedByOperator: t.OwnerConfirmed,

    _migrateId: t.maybe(t.Any),
    _relatedTo: t.maybe(t.String),
    _documentType: t.String,
    _secondMigration: t.maybe(t.Boolean),
    _verifiedMigrateId: t.maybe(t.String)
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
      _relatedTo: '',
      _migrateId: null,
      business: null,
      _secondMigration: false,
      _verifiedMigrateId: null
    }
  }
)

export const OwnerWithInclude = t.OwnerWithInclude = Owner.extend({
  building: t.maybe(t.Building),
  person: t.maybe(t.Person)
})

Owner.prototype.fullName = function () {
  if (this.person) {
    return this.person.fullName()
  }
}

Owner.prototype.setStatus = function ($set) {
  return t.update(this, { status: { $set } })
}

Owner.prototype.pullOutFreezer = function (newStatus) {
  return t.update(this, {
    status: { $set: newStatus },
    business: { $set: null }
  })
}

/**
 * @return {Owner}
 */
t.OwnerWithInclude.prototype.calculateOwnerValidStatus = function () {
  if (!this.person) {
    throw new Error(`owner ${this.id} cannot calculateOwnerStatus`)
  }

  const contacts = _get(this, 'person.contacts', [])
  const hasNoContacts = contacts.length === 0

  const isBadContact = contact =>
    this.confirmedByOperator.value && contact.status === 'BAD'

  const ownerIsInvalid = hasNoContacts || _every(contacts, isBadContact)

  if (ownerIsInvalid) {
    return t.update(this, { status: { $set: OwnerStatus.ERROR } })
  }

  return this
}

Owner.prototype.findFirstGoodContact = function () {
  if (this.person) {
    return this.person.prototype.findFirstGoodContact()
  }
}

Owner.prototype.verifyOwner = function (confirmedBy, value = true, extra = {}) {
  return t.update(this, {
    $merge: Object.assign({}, extra, {
      confirmedByOperator: {
        value,
        confirmedBy,
        confirmedAt: new Date()
      }
    })
  })
}

Owner.prototype.isPrimaryVerified = function () {
  return isPrimaryVerified(this)
}

export function familyOwner (data) {
  const owner = fromJSON(data, Owner)
  return [
    OwnerType.PRINCIPAL,
    OwnerType.SECONDARY
  ].indexOf(owner.type) !== -1
}

export function isPrimary (data) {
  const owner = fromJSON(data, Owner)
  return owner.type === OwnerType.PRINCIPAL
}

export function isPrimaryVerified (data) {
  const owner = fromJSON(data, Owner)
  return owner.confirmedByOperator.value &&
    owner.status === OwnerStatus.VERIFIED &&
    owner.type === OwnerType.PRINCIPAL
}

export function ownerVerified (data) {
  const owner = fromJSON(data, Owner)
  return owner.confirmedByOperator.value &&
    owner.status === OwnerStatus.VERIFIED
}

export function ownerVefifiedNoConfirmed (data) {
  const owner = fromJSON(data, Owner)
  return owner.status === OwnerStatus.VERIFIED
}

export function publicEntity (data) {
  const owner = fromJSON(data, Owner)
  return owner.confirmedByOperator.value &&
    owner.status === OwnerStatus.PUBLIC
}

export function publicEntityNotVerify (data) {
  const owner = fromJSON(data, Owner)
  return owner.status === OwnerStatus.PUBLIC
}

export function isInvalidVerified (data) {
  const owner = fromJSON(data, Owner)
  return owner.confirmedByOperator.value &&
    owner.status === OwnerStatus.ERROR
}

export function isInvalid (data) {
  const owner = fromJSON(data, Owner)
  return owner.status === OwnerStatus.ERROR
}

export function ownerNoSale (data) {
  const owner = fromJSON(data, Owner)
  return owner.confirmedByOperator.value &&
    owner.status === OwnerStatus.NO_SALE
}

export function ownerAlreadySold (data) {
  const owner = fromJSON(data, Owner)
  return owner.confirmedByOperator.value &&
    owner.status === OwnerStatus.ALREADY_SOLD
}

export function isAllowedChangeState (data) {
  const owner = fromJSON(data, Owner)
  return [
    OwnerStatus.ALREADY_SOLD,
    OwnerStatus.NO_SALE,
    OwnerStatus.VERIFIED,
    OwnerStatus.PUBLIC
  ].indexOf(owner.status) !== -1
}

export function haveOwnerBusiness (owners) {
  const ownerWithBusiness = owners.filter(owner => !_.isEmpty(owner.business))

  switch (ownerWithBusiness.length) {
    case 0:
      return null
    case 1:
      return ownerWithBusiness[0]
    default: // more than 1
      return goodOwnerBusiness(ownerWithBusiness)
  }
}

function goodOwnerBusiness (owners) {
  const sorted = owners.sort(sortByConfirmedAt)
  return sorted[0]
}

function sortByConfirmedAt (a, b) {
  const valueA = _.get(a, 'confirmedByOperator.confirmedAt', null)
  const valueB = _.get(b, 'confirmedByOperator.confirmedAt', null)

  if (valueB === null) {
    return -1
  }

  if (valueA === null) {
    return 1
  }

  if (valueA < valueB) {
    return 1
  }

  if (valueB > valueA) {
    return -1
  }

  return 0
}

if (require.main === module) {
  const original = [
    { confirmedByOperator: { confirmedAt: '2019-03-08T16:36:33.390Z' } },
    { confirmedByOperator: null },
    { confirmedByOperator: { confirmedAt: '2019-03-11T13:38:01.453Z' } },
    { confirmedByOperator: null },
    { confirmedByOperator: null }
  ]

  console.log('ORIGINAL', original)

  const sorted = original.sort(sortByConfirmedAt)
  console.log('SORTED  ', sorted)
}

import _ from 'lodash'
import _find from 'lodash/find'
import _get from 'lodash/get'
import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import { Building } from './building'
import { TypedContactInfo } from './common'
import { OwnerStatusEnum, OwnerType } from './enums'

export const OwnerBusiness = t.struct({
  meetingWithOperatorId: t.String
}, 'OwnerBusiness')

export const OwnerBody = t.struct(
  {
    type: t.maybe(t.OwnerType),
    verified: t.maybe(t.Boolean),
    status: OwnerStatusEnum,
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
)

export const Person = t.Person = t.struct(
  {
    id: t.maybe(t.String),
    name: t.String,
    firstName: t.maybe(t.String),
    firstSurname: t.maybe(t.String),
    secondSurname: t.maybe(t.String),
    documentNumber: t.maybe(t.String), // Note: make unique one day

    contacts: t.list(TypedContactInfo),
    addresses: t.list(t.SimpleAddress),
    _address: t.maybe(t.SimpleAddress),
    birthDate: t.maybe(t.Date),
    birthYear: t.maybe(t.Number),
    gender: t.maybe(t.Gender),

    personType: t.PersonType,
    active: t.maybe(t.Boolean),

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
      active: true,
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

t.Person.prototype.fullName = function () {
  return `${this.name}`.trim()
}

t.Person.prototype.contactValueExists = function (value) {
  return !!_find(this.contacts, { value })
}

t.OwnerConfirmed = t.struct({
  value: t.Boolean,
  confirmedBy: t.maybe(t.String),
  confirmedAt: t.maybe(t.Date)
}, 'confirmed')

export const FeaturedContact = t.struct(
  {
    phoneId: t.maybe(t.String),
    emailId: t.maybe(t.String)
  }
)
export const Owner = t.struct(
  {
    id: t.maybe(t.String),
    type: t.OwnerType,
    status: OwnerStatusEnum,
    personId: t.maybe(t.String),
    buildingId: t.maybe(t.String),
    business: t.maybe(OwnerBusiness),
    name: t.maybe(t.String),

    note: t.maybe(t.String),

    confirmedByOperator: t.OwnerConfirmed,
    featuredContact: t.maybe(FeaturedContact),

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
  building: t.maybe(Building),
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
    status: { $set: newStatus }
  })
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

export function familyOwner (data) {
  const owner = fromJSON(data, Owner)
  return [
    OwnerType.PRINCIPAL,
    OwnerType.SECONDARY
  ].indexOf(owner.type) !== -1
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

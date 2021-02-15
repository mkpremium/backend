import _ from 'lodash'
import _find from 'lodash/find'
import t from 'tcomb'
import { Building } from '../building/building'
import { SimpleAddress, TypedContactInfo } from '../types/common'
import { OwnerStatus, OwnerStatusEnum, OwnerTypeEnum } from '../types/enums'
import { validate } from 'tcomb-validation'
import { refineType } from '../infrastructure/refine-type'

export const Person = t.struct(
  {
    id: t.maybe(t.String),
    name: t.String,
    firstName: t.maybe(t.String),
    firstSurname: t.maybe(t.String),
    secondSurname: t.maybe(t.String),
    personType: t.maybe(t.String),
    gender: t.maybe(t.String),

    contacts: t.list(TypedContactInfo),
    documentNumber: t.maybe(t.String),
    addresses: t.list(SimpleAddress)
  },
  {
    name: 'Person',
    defaultProps: {
      contacts: [],
      addresses: []
    }
  }
)
Person.prototype.findContactById = function (id) {
  return _find(this.contacts, { id })
}

Person.prototype.fullName = function () {
  return `${this.name}`.trim()
}

export const OwnerBody = t.struct(
  {
    type: t.maybe(OwnerTypeEnum),
    verified: t.maybe(t.Boolean),
    status: OwnerStatusEnum,
    person: t.maybe(Person),
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
export const OwnerConfirmed = t.struct({
  value: t.Boolean,
  confirmedBy: t.maybe(t.String),
  confirmedAt: t.maybe(t.Date)
}, 'confirmed')
export const FeaturedContact = t.refinement(t.struct({
  phoneId: t.maybe(t.String),
  emailId: t.maybe(t.String)
}), ({ phoneId, emailId }) => !!phoneId || !!emailId, 'FeaturedContact')

export const Owner = t.struct(
  {
    id: t.maybe(t.String),
    type: OwnerTypeEnum,
    status: OwnerStatusEnum,
    personId: t.maybe(t.String),

    person: Person,

    buildingId: t.maybe(t.String),
    name: t.maybe(t.String),

    note: t.maybe(t.String),

    confirmedByOperator: OwnerConfirmed,
    featuredContact: t.maybe(FeaturedContact),

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
      _documentType: 'owner'
    }
  }
)
export const OwnerWithInclude = Owner.extend({
  building: t.maybe(Building)
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

const RefinedOwner = refineType(Owner, o => {
  if (o.featuredContact.phoneId && !getOwnerContact(o, o.featuredContact.phoneId)) {
    return `Unknown contact phoneId=${o.featuredContact.phoneId} in owner=${o.id}`
  }
  if (o.featuredContact.emailId && !getOwnerContact(o, o.featuredContact.emailId)) {
    return `Unknown contact emailId=${o.featuredContact.emailId} in owner=${o.id}`
  }

  return true
})

export const changeContactStatus = (owner, contactId, newStatus) => {
  const contact = owner.person.contacts.find(c => c.id === contactId)
  if (!contact) {
    throw new Error(`Contact "${contactId}" not found in owner "${owner.id}"`)
  }
  const otherContacts = owner.person.contacts.filter(c => c.id !== contactId)

  const contacts = [ { ...contact, status: newStatus, id: contactId }, ...otherContacts ]
  const updatedStatus = _.some(contacts, c => c.status === 'GOOD') ? OwnerStatus.VERIFIED
    : (_.every(contacts, c => c.status === 'BAD') ? OwnerStatus.WITHOUT_CONTACT : owner.status)

  return t.update(owner, {
    $merge: {
      status: updatedStatus,
      person: t.update(owner.person, {
        $merge: { contacts }
      })
    }
  })
}

export const mergeFeaturedContact = (owner, featuredContact) => {
  let updatedOwner = Owner.update(owner, {
    featuredContact: { $set: { ...(owner.featuredContact || {}), ...featuredContact } }
  })
  const validationResult = validate(updatedOwner, RefinedOwner)
  if (!validationResult.isValid()) {
    throw new WrongFeaturedContact(owner.id, featuredContact, validationResult.errors)
  }

  if (featuredContact.phoneId) {
    updatedOwner = changeContactStatus(updatedOwner, featuredContact.phoneId, 'GOOD')
  }
  if (featuredContact.emailId) {
    updatedOwner = changeContactStatus(updatedOwner, featuredContact.emailId, 'GOOD')
  }

  return updatedOwner
}

export const contactOfId = (owner, contactId) => {
  return owner.person.contacts.find(({ id }) => id === contactId)
}

const getOwnerContact = (o, contactId) => o.person.contacts.find(({ id }) => id === contactId)

export class WrongFeaturedContact extends Error {
  constructor (ownerId, featuredContact, validationErrors) {
    super('Wrong Featured Contact provided')
    this.ownerId = ownerId
    this.featuredContact = featuredContact
    this.errors = validationErrors.map(({ message }) => message)
  }
}

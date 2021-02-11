import _ from 'lodash'
import _find from 'lodash/find'
import t from 'tcomb'
import { Building } from '../building/building'
import { SimpleAddress, TypedContactInfo } from '../types/common'
import { OwnerStatus, OwnerStatusEnum, OwnerTypeEnum } from '../types/enums'

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
export const FeaturedContact = t.struct(
  {
    phoneId: t.maybe(t.String),
    emailId: t.maybe(t.String)
  }
)
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

Owner.prototype.changeContactStatus = function (contactId, newStatus) {
  const contact = this.person.contacts.find(c => c.id === contactId)
  if (!contact) {
    throw new Error(`Contact "${contactId}" not found in owner "${this.id}"`)
  }
  const otherContacts = this.person.contacts.filter(c => c.id !== contactId)

  const contacts = [ { ...contact, status: newStatus, id: contactId }, ...otherContacts ]
  const updatedStatus = _.some(contacts, c => c.status === 'GOOD') ? OwnerStatus.VERIFIED
    : (_.every(contacts, c => c.status === 'BAD') ? OwnerStatus.WITHOUT_CONTACT : this.status)

  return t.update(this, {
    $merge: {
      status: updatedStatus,
      person: t.update(this.person, {
        $merge: { contacts }
      })
    }
  })
}

export const mergeFeaturedContact = (owner, featuredContact) => {
  // TODO mark contact as GOOD
  // TODO set only given featured contact (phone or email)
  assertValidFeaturedContact(featuredContact, owner)
  return Owner.update(owner, {
    featuredContact: {
      $set: featuredContact
    }
  })
}

const assertValidFeaturedContact = (featuredContact, owner) => {
  if (_.isEmpty(featuredContact.phoneId) && _.isEmpty(featuredContact.emailId)) {
    throw new EmptyFeaturedContact()
  }

  if (featuredContact.phoneId && !getOwnerContact(owner, featuredContact.phoneId)) {
    throw new UnknownOwnerContact(owner.id, featuredContact.phoneId, 'phone')
  }
  if (featuredContact.emailId && !getOwnerContact(owner, featuredContact.emailId)) {
    throw new UnknownOwnerContact(owner.id, featuredContact.phoneId, 'phone')
  }
}

const getOwnerContact = (o, contactId) => o.person.contacts.find(({ id }) => id === contactId)

class UnknownOwnerContact extends Error {
  constructor (ownerId, contactId, contactType) {
    super('Unknown contact')
    this.ownerId = ownerId
    this.contactId = contactId
    this.contactType = contactType
  }
}

export class EmptyFeaturedContact extends Error {
  constructor () {
    super('No phoneId nor emailId provided')
  }
}

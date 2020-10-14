import _ from 'lodash'
import _find from 'lodash/find'
import t from 'tcomb'
import { Building } from './building'
import { SimpleAddress, TypedContactInfo } from './common'
import { OwnerStatus, OwnerStatusEnum, OwnerTypeEnum } from './enums'

export const Person = t.struct(
  {
    id: t.maybe(t.String),
    name: t.String,
    firstName: t.maybe(t.String),

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

Person.prototype.findContactById = function (id) {
  return _find(this.contacts, { id })
}

Person.prototype.fullName = function () {
  return `${this.name}`.trim()
}

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

    person: t.maybe(Person),

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

Owner.prototype.updateContact = function (contactId, data) {
  const contact = this.person.contacts.find(c => c.id === contactId)
  if (!contact) {
    throw new Error(`Contact "${contactId}" not found in owner "${this.id}"`)
  }
  const otherContacts = this.person.contacts.filter(c => c.id !== contactId)

  const contacts = [ { ...contact, ...data, id: contactId }, ...otherContacts ]
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

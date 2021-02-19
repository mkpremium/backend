import { Owner, Person } from '../../src/owner/owner'

const ownerPrototype = {
  id: 'test-owner-id',
  person: Person({
    name: 'test name'
  })
}
export const ownerBuilder = (overwrites = {}) => {
  return {
    build () {
      return Owner({ ...ownerPrototype, ...overwrites })
    },

    withPhoneContact (id = 'test-phone-id', status = 'UNDEFINED', phoneNumber = '666666666') {
      if (!overwrites.person) {
        overwrites.person = ownerPrototype.person
      }

      overwrites.person = Person.update(overwrites.person, {
        contacts: {
          $push: [ {
            id,
            type: 'TELEFONO',
            value: phoneNumber
          } ]
        }
      })

      return this
    },

    withFeaturedPhone (phoneId) {
      if (!overwrites.featuredContact) {
        overwrites.featuredContact = {}
      }

      overwrites.featuredContact.phoneId = phoneId
      return this
    },

    withEmailContact (id = 'test-email-id', status = 'UNDEFINED', email = 'test@example.org') {
      if (!overwrites.person) {
        overwrites.person = ownerPrototype.person
      }

      overwrites.person = Person.update(overwrites.person, {
        contacts: {
          $push: [ {
            id,
            type: 'EMAIL',
            value: email
          } ]
        }
      })

      return this
    }
  }
}

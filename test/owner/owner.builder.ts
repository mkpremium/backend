import { Owner as OwnerStruct, OwnerProps, Person, PersonProps } from '../../src/owner/owner'
import uuid from 'uuid/v4'

const ownerPrototype: Partial<OwnerProps> = {
  name: 'test name',
  person: Person({
    name: 'test name'
  }) as PersonProps
}

export const ownerBuilder = (overwrites: Partial<OwnerProps> = {}) => {
  return {
    build (): OwnerProps {
      return OwnerStruct({ ...ownerPrototype, id: uuid(), ...overwrites } as OwnerProps)
    },

    withPhoneContact (id = 'test-phone-id', status = 'UNDEFINED', phoneNumber = '666666666') {
      if (!overwrites.person) {
        overwrites.person = { ...ownerPrototype.person }
      }

      overwrites.person = Person.update(overwrites.person, {
        contacts: {
          $push: [{
            id,
            type: 'TELEFONO',
            value: phoneNumber,
            status
          }]
        }
      }) as PersonProps

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
          $push: [{
            id,
            type: 'EMAIL',
            value: email,
            status
          }]
        }
      }) as PersonProps

      return this
    }
  }
}

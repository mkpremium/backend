import { Owner as OwnerStruct, Person } from '../../src/owner/owner'

interface ContactProps {
  id: string;
  type: 'TELEFONO' | 'FAX' | 'MOVIL' | 'EMAIL' | 'SITIO_WEB';
  value: string;
  status: 'UNDEFINED' | 'GOOD' | 'BAD';
}

interface PersonProps {
  id: string;
  name: string;
  firstName: string,
  firstSurname: string,
  secondSurname: string,

  contacts: ContactProps[],
}

interface OwnerProps {
  id: string;
  type: 'NINGUNO' | 'PRINCIPAL' | 'SECUNDARIO' | 'VECINO' | 'FAMILIAR' | 'HERMANOS' | 'HIJOS' | 'MISMA CASA';
  status: 'NO_VERIFICADO' | 'VERIFICADO' | 'ERRONEO' | 'ENTE_PUBLICO' | 'WITHOUT_CONTACT';
  person: PersonProps;
  buildingId: string,
  name: string,
  featuredContact?: {
    phoneId?: string;
    emailId?: string;
  };
}

const ownerPrototype = {
  id: 'test-owner-id',
  name: 'test name',
  person: Person({
    name: 'test name'
  })
}

export const ownerBuilder = (overwrites: Partial<OwnerProps> = {}) => {
  return {
    build () {
      return OwnerStruct({ ...ownerPrototype, ...overwrites })
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

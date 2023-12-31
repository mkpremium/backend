import { Factory } from 'rosie'
import { BuildingAddressProps, BuildingProps, NegotiationStatus } from '../src/building/building'
import uuid from 'uuid/v4'
import { ContactProps } from '../src/owner/owner'
import { Worksheet } from '../src/worksheet/worksheet.entity'
import { Caller } from '../src/caller/caller.entity'

const EntityFactory = Factory.define<{id: string}>('Entity')
  .attr('id', () => uuid())

export const callerFactory = Factory.define<Caller>('caller').extend(EntityFactory)
  .attr('user', () => Factory.attributes('user', {}))

export const flipperFactory = Factory.define('flipper').extend(EntityFactory)
  .attr('user', () => Factory.attributes('user', {}))

Factory.define('user-credentials')
  .sequence('username', idx => `test-user-${idx}`)
  .attr('password', 'test-User-pa$$w0rd')

Factory.define('user')
  .extend('user-credentials')
  .option('roles', [])
  .attrs({
      profile: () => Factory.attributes('user-profile', {}),
      enabled: true,
      roles: []
    }
  )

Factory.define('user-profile')
  .attrs({
    firstName: 'User-Name',
    lastName: 'User-Surname',
    city: 'User CITY',
    language: 'es',
    email: 'user@email.test',
  })

export const phoneContactFactory = Factory.define<ContactProps>('phone-contact').extend('Entity')
  .attrs({
    status: 'UNDEFINED',
    type: 'MOVIL',
    value: '666666666'
  })

export const emailContactFactory = Factory.define<Omit<ContactProps, 'id'>>('email-contact')
  .attrs({
    status: 'UNDEFINED',
    type: 'EMAIL',
    value: 'test@email.org',
  })

export const buildingFactory = Factory.define<BuildingProps>('building')
  .attr('address', () => buildingAddressFactory.attributes())
  .attr('id', () => uuid())
  .attrs({
    negotiationStatus: 'PENDIENTE',
    floorArea: 0,
    metadata: [],
    location: {
      lat: 0,
      lng: 0,
    }
  })

export const buildingAddressFactory = Factory.define<BuildingAddressProps>('address')
  .attrs({
    type: 'CL',
    street: 'street, address',
    province: '',
    neighborhood: '',
    postalCode: {
      number: '0000',
      verified: false,
    },
    city: 'BARCELONA',
  })
  .sequence('number', (idx) => `${idx}`)
  .after((address) => ({
    ...address,
    fullAddress: `${address.street} ${address.number}, ${address.city}`
  }))

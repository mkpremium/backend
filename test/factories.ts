import { Factory } from 'rosie'
import type { BuildingAddressProps, BuildingProps } from '../src/building/building'
import uuid from 'uuid/v4'
import type { ContactProps } from '../src/owner/owner'
import type { Caller } from '../src/caller/caller.entity'
import type { WorksheetQueueProps } from '../src/worksheet/domain/queue'
import { WorksheetProps } from '../src/worksheet/domain/worksheet'
import { Flipper } from '../src/flipper/flipper.entity'
import { UserProfileProps } from '../src/types/user'

const EntityFactory = Factory.define<{ id: string }>('Entity')
  .attr('id', () => uuid())

export const userCredentialsFactory = Factory.define<{username: string, password: string}>('user-credentials')
  .sequence('username', idx => `test-user-${idx}`)
  .attr('password', 'test-User-pa$$w0rd')

export const userProfileFactory = Factory.define<UserProfileProps>('user-profile')
  .attrs({
    firstName: 'User-Name',
    lastName: 'User-Surname',
    city: 'User CITY',
    language: 'es',
    email: 'user@email.test'
  })

export const userFactory = Factory.define('user')
  .extend('user-credentials')
  .option('roles', [])
  .attrs({
    profile: () => Factory.attributes('user-profile', {}),
    enabled: true,
    roles: []
  }
  )

export const callerFactory = Factory.define<Caller>('caller').extend(EntityFactory)
  .attr('user', () => userFactory.attributes({}))

export const flipperFactory = Factory.define<Flipper>('flipper').extend(EntityFactory)
  .attr('user', () => userFactory.attributes({}))

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
    value: 'test@email.org'
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
      lng: 0
    }
  })

export const buildingAddressFactory = Factory.define<BuildingAddressProps>('address')
  .attrs({
    type: 'CL',
    street: 'street, address',
    province: 'TEST_BARCELONA',
    neighborhood: '',
    postalCode: {
      number: '0000',
      verified: false
    },
    city: 'TEST_BARCELONA'
  })
  .sequence('number', (idx) => `${idx}`)
  .after((address) => ({
    ...address,
    fullAddress: `${address.street} ${address.number}, ${address.city}`
  }))

export const worksheetQueueFactory = Factory.define<WorksheetQueueProps>('worksheet-queue')
  .extend('Entity')
  .sequence('name', idx => `test worksheet queue ${idx}`)
  .attrs({
    source: { province: 'TEST_BARCELONA' },
    worksheets: []
  })

export const worksheetFactory = Factory.define<WorksheetProps>('worksheet')
  .extend('Entity')
  .option('buildingId')
  .attr('relatedBuildingIds', ['buildingId'], buildingId => [buildingId])
  .attr('status', 'OPEN')

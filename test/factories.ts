import { Factory } from 'rosie'

Factory.define('caller')
  .attr('user', () => Factory.attributes('user', {}))

Factory.define('flipper')
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

Factory.define('phone-contact')
  .attrs({
    status: 'UNDEFINED',
    type: 'MOVIL',
    value: '666666666'
  })

Factory.define('email-contact')
  .attrs({
    status: 'UNDEFINED',
    type: 'EMAIL',
    value: 'test@email.org',
  })

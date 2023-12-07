import { Factory } from 'rosie'

Factory.define('caller')
  .attr('user', () => Factory.attributes('user', {}))

Factory.define('flipper')
  .attr('user', () => Factory.attributes('user', {}))

Factory.define('user')
  .sequence('username', idx => `user-${idx}`)
  .attr('password', 'test-password')

Factory.define('phone-contact')
  .attrs({
    status: 'UNDEFINED',
    type: 'MOVIL',
    value: '666666666'
  })

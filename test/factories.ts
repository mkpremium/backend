import {Factory} from 'rosie'
import { Flipper } from '../src/flipper/flipper.entity'
import { User } from '../src/user/user.entity'

Factory.define('flipper', Flipper)
  .attr('user', () => Factory.attributes('user', {}))

Factory.define('user', User)

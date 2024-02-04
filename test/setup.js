/* eslint-disable */

require('../src/types')
require('./factories')

const chai = require('chai')
const sc = require('sinon-chai')
const chaiAsPromised = require('chai-as-promised')
process.env.COUCHBASE_BUCKET = 'mkpremium_test'
process.env.NODE_ENV = 'test'

chai.should()
chai.use(sc)
chai.use(chaiAsPromised)

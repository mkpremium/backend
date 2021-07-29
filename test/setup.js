import honeycomb from 'honeycomb-beeline'
honeycomb()

require('../src/types')

const chai = require('chai')
const sc = require('sinon-chai')
const chaiAsPromised = require('chai-as-promised')
process.env.COUCHBASE_BUCKET = 'mkpremium_test'

chai.should()
chai.use(sc)
chai.use(chaiAsPromised)

require('honeycomb-beeline')({ disableInstrumentation: true })

require('../src/types')
require('./factories')

const chai = require('chai')
const sc = require('sinon-chai')
const chaiAsPromised = require('chai-as-promised')
process.env.COUCHBASE_BUCKET = 'mkpremium_test'

chai.should()
chai.use(sc)
chai.use(chaiAsPromised)

require('honeycomb-beeline')({ disableInstrumentation: true })

const chai = require('chai')

const chaiAsPromised = require('chai-as-promised')

chai.should()
chai.use(chaiAsPromised)

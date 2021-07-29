import honeycomb from 'honeycomb-beeline'
honeycomb()

const chai = require('chai')

const chaiAsPromised = require('chai-as-promised')

chai.should()
chai.use(chaiAsPromised)

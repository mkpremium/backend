require('../src/types')

const chai = require('chai')
const sc = require('sinon-chai')
const chaiAsPromised = require('chai-as-promised')

chai.should()
chai.use(sc)
chai.use(chaiAsPromised)

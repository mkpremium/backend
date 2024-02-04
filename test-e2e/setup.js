/* eslint-disable */
process.env.NODE_ENV = 'test'
const chai = require('chai')

const chaiAsPromised = require('chai-as-promised')

chai.should()
chai.use(chaiAsPromised)

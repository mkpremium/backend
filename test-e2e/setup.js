require('@babel/register')
require('@babel/polyfill')
const chai = require('chai')

const chaiAsPromised = require('chai-as-promised')

chai.should()
chai.use(chaiAsPromised)

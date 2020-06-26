require('@babel/register')
require('@babel/polyfill')

const path = require('path')

require('dotenv').config({
  path: path.resolve(__dirname, '.env')
})

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

chai.should()
chai.use(chaiAsPromised)

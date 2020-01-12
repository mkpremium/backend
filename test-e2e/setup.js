require('@babel/register')
require('@babel/polyfill')

// disable gearman winston log
const w = require('winston')
w.remove(w.transports.Console)

const path = require('path')

require('dotenv').config({
  path: path.resolve(__dirname, '.env')
})

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

chai.should()
chai.use(chaiAsPromised)

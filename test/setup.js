require('babel-register');
require('babel-polyfill');

require('../src/types');

const chai = require('chai');
const sc = require('sinon-chai');

chai.should();
chai.use(sc);

#!/usr/bin/env babel-node
import program from 'commander'

require('dotenv').config()

program
  .version('0.0.1')
  .command('operator', 'Gestiona operadores (cuentas de usuario)')
  .parse(process.argv)

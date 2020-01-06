#!/usr/bin/env babel-node

import program from 'commander'

program
  .version('0.0.1')
  .command('add', 'Agrega operador')
  .parse(process.argv)

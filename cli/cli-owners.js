#!/usr/bin/env babel-node

import program from 'commander';

program
  .version('0.0.1')
  .command('check', 'Verifica cuantos owners no tienen edificio ni estan asociados al edificio que dice estarlo')
  .parse(process.argv);

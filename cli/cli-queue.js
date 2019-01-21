#!/usr/bin/env babel-node

import program from 'commander';

program
  .version('0.0.1')
  .command('clean', 'Limpia una cola de trabajo, libera las worksheet que quedan en el limbo')
  .command('clean-all', 'Limpia todas las colas de trabajo, libera las worksheet que quedan en el limbo')
  .parse(process.argv);

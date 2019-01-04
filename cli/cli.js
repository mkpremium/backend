#!/usr/bin/env babel-node
import program from 'commander';

program
  .version('0.0.1')
  .command('building-notes [input-file]', 'Agrega notas los edificios')
  .command('building-states [input-dir]', 'Actualiza el estado de los edificios')
  .parse(process.argv);

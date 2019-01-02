#!/usr/bin/env babel-node
import program from 'commander';

program
  .version('0.0.1')
  .command('building-notes [input-file]', 'Agrega notas los edificios')
  .parse(process.argv);

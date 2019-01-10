#!/usr/bin/env babel-node
import program from 'commander';

program
  .version('0.0.1')
  .command('migrate-worksheets [input-dir]', 'Migra hojas de trabajo anteriores')
  .command('building-notes [input-file]', 'Agrega notas los edificios')
  .command('building-states [input-dir]', 'Actualiza el estado de los edificios')
  .command('owners-verify [input-file]', 'Verifica los owners')
  .command('db-indexes', 'Recrea los indices de la base de datos')
  .command('operator', 'Gestiona operadores (cuentas de usuario)')
  .parse(process.argv);

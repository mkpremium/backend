#!/usr/bin/env babel-node

import program from 'commander';

program
  .version('0.0.1')
  .command('synchronize-firebase', 'Sincronizar la data del edificio y owner a firebase')
  .command('migrate-portugal', 'Migrar edificios/worksheets')
  .command('migrate-portugal-contacts', 'Migrar contactos de portugal')
  .parse(process.argv);

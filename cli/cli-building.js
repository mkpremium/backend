#!/usr/bin/env babel-node

import program from 'commander';

program
  .version('0.0.1')
  .command('synchronize-firebase', 'Sincronizar la data del edificio y owner a firebase')
  .command('migrate-portugal', 'Migrar edificios/worksheets')
  .command('migrate-portugal-contacts', 'Migrar contactos de portugal')
  .command('migrate-portugal-fix-fields', 'Poner la latitud y longitud en 0 para los que sean null y cambiar la ciudad a mayuscula')
  .command('migrate-portugal-rename-city', 'Cambiar la ciudad de mayuscula a común')
  .command('migrate-portugal-address-type', 'Cambiar el tipo en la dirección')
  .parse(process.argv);

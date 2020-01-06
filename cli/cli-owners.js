#!/usr/bin/env babel-node

import program from 'commander'

program
  .version('0.0.1')
  .command('check', 'Verifica cuantos owners no tienen edificio ni estan asociados al edificio que dice estarlo')
  .command('add-phones', 'Añade la columna pendiente de número de celular a los propietarios')
  .command('synchronize-firebase', 'Añade la columna pendiente de número de celular a los propietarios')
  .parse(process.argv)

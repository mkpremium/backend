#!/usr/bin/env babel-node
import program from 'commander'

require('dotenv').config()

program
  .version('0.0.1')
  .command('migrate-worksheets [input-dir]', 'Migra hojas de trabajo anteriores')
  .command('building-notes [input-file]', 'Agrega notas los edificios')
  .command('building-states [input-dir]', 'Actualiza el estado de los edificios')
  .command('business-states [input-dir]', 'Actualiza el estado del business')
  .command('building-entities [input-file]', 'Migración situación arrendataria')
  .command('owners-verify [input-file]', 'Verifica los owners')
  .command('db-indexes', 'Recrea los indices de la base de datos')
  .command('operator', 'Gestiona operadores (cuentas de usuario)')
  .command('queue', 'Gestiona colas de trabajo')
  .command('building-metadata [input-file]', 'Sube a la nube los archivos relacionados con edificios y los asocia a estos')
  .command('db-indexes-full-text-search', 'Recrea los indices de la base de datos para el full text search')
  .command('migrate-persons [input-file]', 'Migración de personas.')
  .command('owners', 'Procesos que tienen que ver con owners')
  .command('metadata', 'Procesos que tienen que ver la metadata de los edificios')
  .command('building', 'Procesos que tienen que ver con el edificio')
  .command('migrate-persons-v2 [input-file]', 'Migración de personas diferente formato de archivo.')
  .parse(process.argv)

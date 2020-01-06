#!/usr/bin/env babel-node
import program from 'commander'
import fs from 'fs-extra'
import couchbase from '../src/db/couchbase'
import {validateHeaders} from './lib'
import {migratePersons} from './lib/migrate-persons'

// region main entry
program
  .arguments('[input-file]')
  .version('0.0.1')
  .action(mainAction)
  .parse(process.argv)

function mainAction () {
  if (program.args.length === 0) {
    console.error('input-file is required.')
    program.help()
  }

  main.apply(null, arguments)
    .then(() => {
      process.exit(0)
    })
    .catch(err => {
      console.error(err)
      process.exit(1)
    })
}

// endregion

async function main (inputFile) {
  await validateFile(inputFile)
  await couchbase()
  await migratePersons(inputFile)
}

// region file-management
async function validateFile (inputFile) {
  const pathExists = await fs.pathExists(inputFile)
  if (!pathExists) {
    throw new Error(`'${inputFile} doesn't exist or cannot be read`)
  }

  return validateHeaders(inputFile, `"ido";"provincia";"municipio";"apellido_1";"apellido_2";"nombre";"tipo_via";"nombre_via";"num_via";"bloque";"portal";"escalera";"piso";"puerta";"dia_naci";"mes_naci";"ano_naci";"cod_post";"nuc";"proprietari";"domicili";"telefono_pb";"telefono_ib";"telefono_db";"telefono_abc";"domicili_pb";"domicili_ib";"domicili_db";"domicili_abc";"sexo";"edad";"tel_he";"movil_he";"tipo_persona";"id_catastro"`)
}
// endregion

#!/usr/bin/env babel-node
import program from 'commander';
import fs from 'fs-extra';
import couchbase from '../src/db/couchbase';
import {validateHeaders} from './lib';
import {migratePersons} from './lib/migrate-persons-v2';

// region main entry
program
  .arguments('[input-file]')
  .version('0.0.1')
  .action(mainAction)
  .parse(process.argv);

function mainAction() {
  if (program.args.length === 0) {
    console.error('input-file is required.');
    program.help();
  }

  main.apply(null, arguments)
    .then(() => {
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

// endregion

async function main(inputFile) {
  await validateFile(inputFile);
  await couchbase();
  await migratePersons(inputFile);
}

// region file-management
async function validateFile(inputFile) {
  const pathExists = await fs.pathExists(inputFile);
  if (!pathExists) {
    throw new Error(`'${inputFile} doesn't exist or cannot be read`);
  }

  return validateHeaders(inputFile, `"nombre";"apellido_1";"apellido_2";"nombre_completo";"tipo_via";"nombre_via";"num_via";"piso";"puerta";"cp";"provincia";"dni";"sexo";"movil_1";"fijo";"movil_2";"id_catastro"`);
}
// endregion

#!/usr/bin/env babel-node
import program from 'commander';
import fs from 'fs-extra';
import couchbase from '../src/db/couchbase';
import {validateHeaders} from './lib';
import {migratePersons} from './lib/migrate-persons';

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

  return validateHeaders(inputFile, 'ID;PROVINCIA;MUNICIPIO;APELLIDO_1;APELLIDO_2;NOMBRE;TIPO_VIA;NOMBRE_VIA;NUM_VIA;BLOQUE;PORTAL;ESCALERA;PISO;PUERTA;DIA_NACI;MES_NACI;ANO_NACI;COD_POST;NUC;PROPRIETARI;DOMICILI;TELEFONO_PB;TELEFONO_IB;TELEFONO_DB;TELEFONO_ABC;DOMICILI_PB;DOMICILI_IB;DOMICILI_DB;DOMICILI_ABC;SEXO;EDAD;TEL_HE;MOVIL_HE;TIPO_PERSONA;ID_CATASTRO');
}
// endregion

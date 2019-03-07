#!/usr/bin/env babel-node
import program from 'commander';
import fs from 'fs-extra';
import couchbase from '../src/db/couchbase';
import {cleanNotes} from './lib/migrate-utils';
import {migrateBuildingNotes} from './lib/migrate-building-notes';

// ~/Descargas/HISTORIAL_CON_PRIMER_IDCATASTRO.csv
// ID;ID_CATASTRO;FECHA;ID_OPERDADOR;NOTAS
// 471497;18350;2017-01-02 12:49:01.000;N.CERVERA;DE MOMENTO NO VENDEN IGUAL DENTRO DE 3 MESES SI
// 471542;12975;2017-01-02 13:12:09.000;L.GOMEZ;DEJO DATOS
// 472064;7895;2017-01-02 17:33:01.000;N.CERVERA;LO COMENTA CON SU PADRE
// 472234;28314;2017-01-03 10:08:51.000;S.VILLAR;NO HAY INTERES EN COMPRAR, DESCARTAMOS
// 472257;5890;2017-01-03 10:18:35.000;C.JIMENEZ;932 008 225 DEJAMOS DATOS. ELLOS LLAMARÁN CUANDO VUELVAN A BCN.
// 472287;5390;2017-01-03 10:30:00.000;S.VILLAR;DEJAMOS CONTACTO, LLAMARAN
// 472476;11408;2017-01-03 11:54:12.000;L.GOMEZ;PROPIETARIOS : NUÑEZ Y NAVARRO
// 472541;10845;2017-01-03 12:20:22.000;N.CERVERA;SR. LUIS NO ES PROPIETARIO

// region main entry
program
  .arguments('[input-file]')
  .version('0.0.1')
  .option('-c, --clean', 'Elimina los datos previos')
  .action(mainAction)
  .parse(process.argv);

function mainAction() {
  if (program.args.length === 0) {
    console.error('input-file is required');
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
  await cleanNotes(program.clean);
  await migrateBuildingNotes(inputFile);
}

// region file-management
async function validateFile(inputFile) {
  const pathExists = await fs.pathExists(inputFile);
  if (!pathExists) {
    throw new Error(`'${inputFile} doesn't exist or cannot be read`);
  }
}
// endregion

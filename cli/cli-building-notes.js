#!/usr/bin/env babel-node
import program from 'commander';
import fs from 'fs-extra';
import {exec} from 'child_process';
import {MigrateModelV3} from '../src/migration/lib/migrate-model-v3';
import {BuildingRepository} from '../src/building/models';
import {NoteRepository} from '../src/notes/models';
import {madrid} from '../src/lib/date';
import {removeNullValue} from '../src/migration/models/models-helper';

// ~/Descargas/HISTORIAL_CON_PRIMER_IDCATASTRO.csv
// ID;ID_CATASTRO;FECHA;ID_OPERDADOR;NOTAS

// region main entry
program
  .arguments('[input-file]')
  .version('0.0.1')
  .action(mainAction)
  .parse(process.argv);

function mainAction() {
  if (program.args.length === 0) {
    console.error('input-file is required');
    program.help();
  }

  main.apply(null, arguments)
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
// endregion

async function main(inputFile) {
  await validateFile(inputFile);
  const migrate = new BuildingNotes(inputFile);
  await migrate.run();
}

// region file-management
async function validateFile(inputFile) {
  const pathExists = await fs.pathExists(inputFile);
  if (!pathExists) {
    throw new Error(`'${inputFile} doesn't exist or cannot be readed`);
  }

  return validateHeaders(inputFile);
}

async function validateHeaders(inputFile) {
  const expectedHeaders = 'ID;ID_CATASTRO;FECHA;ID_OPERDADOR;NOTAS';
  const headers = await head(inputFile);
  if (headers !== expectedHeaders) {
    throw new Error(`${inputFile} should have the following first line '${expectedHeaders}', but found '${headers}'`);
  }
}

async function head(filename, number = 1) {
  return new Promise((resolve, reject) => {
    exec(`head -n${number} ${filename}`, (err, stdout) => {
      if (err) {
        reject(err);
      } else {
        resolve(stdout.replace(/\n/, ''));
      }
    });
  });
}
// endregion

class BuildingNotes extends MigrateModelV3 {
  async parseToData(data, row) {
    try {
      await createBuildingNote(data);
    } catch (e) {
      console.error(`at row ${row}, ${e.message}`);
    }
  }
}

async function createBuildingNote(data) {
  const building = await findBuilding(data);
  return createNote(building, data);
}

async function findBuilding(data) {
  const repo = new BuildingRepository();
  const migratedId = removeNullValue(data['ID_CATASTRO']);
  if (migratedId === null) {
    throw new Error(`invalid ID_CATASTRO '${data['ID_CATASTRO']}'`);
  }
  return repo.findByMigratedId(migratedId);
}

async function createNote(building, data) {
  const repo = new NoteRepository();
  const note = {
    note: noteBody(data),
    createdAt: noteDate(data),
    context: {
      buildingId: building.id
    }
  };

  return repo.createNote(note, 'migration');
}

function noteBody(data) {
  return `${data['NOTAS']} - ${data['ID_OPERADOR']}`;
}

export function noteDate(data) {
  return madrid(new Date(data['FECHA'])).toDate();
}

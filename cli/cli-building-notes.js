#!/usr/bin/env babel-node
import program from 'commander';
import fs from 'fs-extra';
import {MigrateModelV3} from '../src/migration/lib/migrate-model-v3';
import {BuildingRepository} from '../src/building/models';
import {NoteRepository} from '../src/notes/models';
import {madrid} from '../src/lib/date';
import {removeNullValue} from '../src/migration/models/models-helper';
import {validateHeaders} from './lib';

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

  return validateHeaders(inputFile, 'ID;ID_CATASTRO;FECHA;ID_OPERDADOR;NOTAS');
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
  return migrateNote(building, data);
}

async function findBuilding(data) {
  const repo = new BuildingRepository();
  const buildingMigrateId = removeNullValue(data['ID_CATASTRO']);
  if (buildingMigrateId === null) {
    throw new Error(`invalid ID_CATASTRO '${data['ID_CATASTRO']}'`);
  }
  return repo.findByMigratedId(buildingMigrateId);
}

async function migrateNote(building, data) {
  const migrateId = removeNullValue(data['ID']);

  if (migrateId === null) {
    throw new Error('cannot migrate notes with invalid note ID');
  }

  const itWasMigrated = await noteWasMigrated(migrateId);

  if (itWasMigrated) {
    return;
  }

  return createNote(data, building.id, migrateId);
}

async function noteWasMigrated(migrateId) {
  const repo = new NoteRepository();
  const qb = repo.getQueryBuilder()
    .where('context._migrateId = ?', migrateId)
    .limit(1);
  const result = await repo.query(qb);
  return result && result.length > 0;
}

async function createNote(data, buildingId, migrateId) {
  const repo = new NoteRepository();

  const note = {
    note: noteBody(data),
    createdAt: noteDate(data),
    context: {
      buildingId: buildingId,
      _migrateId: migrateId
    }
  };
  return repo.createNote(note, 'migration');
}

function noteBody(data) {
  return `${data['NOTAS']} - ${data['ID_OPERADOR']}`;
}

function noteDate(data) {
  return madrid(new Date(data['FECHA'])).toDate();
}

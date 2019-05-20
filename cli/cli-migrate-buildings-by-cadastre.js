#!/usr/bin/env babel-node

import program from 'commander';
import debug from 'debug';
import {actionWrapper} from './lib';
import {getBuildingByCadastre} from '../src/cadastre/models';
import {BuildingRepository} from '../src/building/models';
import {WorksheetRepository} from '../src/worksheet/models/worksheet';
import {createBuildingWithWorksheet} from '../src/worksheet/building/model';
import {csvToJSON} from '../src/migration/lib/migrate-model-v3';

const debugCli = debug('app:migration:buildings-by-cadastre');

if (require.main === module) {
  program
    .arguments('Migra edificios por referencia catastral')
    .option('-r --reference <reference>', 'Referencia catastral')
    .option('-i --rid <migrateId>', 'Referencia o ID en la vieja app')
    .option('-f --file <file>', 'Archivo CSV que incluye referencias catastrales')
    .action(actionWrapper(main))
    .parse(process.argv);
}

async function main() {
  if (program.reference) {
    const extras = program.rid ? {_migrateId: program.rid} : {};
    return processByReference(program.reference, extras);
  }

  if (program.file) {
    return processByFile(program.file);
  }

  program.help();
}

export async function processByReference(cadastreReference, extraData = {}) {
  const existingBuilding = await BuildingRepository.findByCadastreReference(cadastreReference);

  if (existingBuilding) {
    debugCli(`El edificio para '${cadastreReference}' existe en la base, omitiendo creación`);
    // Building exists on database, skipping creation
    const existingWorksheet = await WorksheetRepository.findByBuilding(existingBuilding.id);
    if (!existingWorksheet) {
      debugCli(`El edificio para '${cadastreReference}' no tiene worksheet agregando worksheet`);
      return WorksheetRepository.createNewForBuilding(existingBuilding);
    } else {
      return existingWorksheet;
    }
  } else {
    debugCli(`Creando el edificio para '${cadastreReference}'`);
    const buildingFromCadastre = await getBuildingByCadastre(cadastreReference);
    const buildingFromCadastreWithExtras = Object.assign({}, buildingFromCadastre, extraData);
    return createBuildingWithWorksheet(buildingFromCadastreWithExtras);
  }
}

export async function processByFile(filename) {
  const options = {
    delimiter: ';',
    fork: false
  };
  await csvToJSON(filename, processByFileRow, options);
}

async function processByFileRow(data, row) {
  const _migrateId = data['ID'];
  const cadastreReference = data['REFERENCE'];
  try {
    await processByReference(cadastreReference, {_migrateId});
  } catch (e) {
    debugCli(`ignorando edificio con catastro ${cadastreReference}, fila ${row}`, e.message);
  }
}

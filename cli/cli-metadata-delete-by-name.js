#!/usr/bin/env babel-node
import '../src/types';
import path from 'path';
import debug from 'debug';
import program from 'commander';
import {actionWrapper} from './lib';
import {BuildingRepository} from '../src/building/models';
import {filenameExistOnBuilding} from './lib/migrate-building-metadata';

const debugDelete = debug('app:cli:metadata-delete-by-name');

if (require.main === module) {
  program
    .option('-N --name <name>', 'Nombre del archivo, el nombre del archivo debe incluir ID del building', null)
    .option('--dry-run', 'No realiza los cambios', false)
    .version('0.0.1')
    .action(actionWrapper(main))
    .parse(process.argv);
}

async function main() {
  const filepath = program.name;

  if (!filepath) {
    program.help();
  }

  const lookupData = path.basename(filepath, path.extname(filepath));
  const repo = new BuildingRepository();
  const building = await repo.findBuildingByMetadataMigration(lookupData);
  const metadata = filenameExistOnBuilding(building, filepath);

  debugDelete('found on building', building.id);

  if (metadata) {
    if (program.dryRun) {
      debugDelete('[dry-run] deleting', metadata);
    } else {
      debugDelete('deleting', metadata);
      await repo.removeMetadataFromBuilding(building, metadata);
    }
  }
}

#!/usr/bin/env babel-node

import Promise from 'bluebird';
import program from 'commander';
import {actionWrapper} from './lib';
import {WorksheetRepository} from '../src/worksheet/models/worksheet';

if (require.main === module) {
  program
    .arguments('')
    .version('0.0.1')
    .action(actionWrapper(main))
    .parse(process.argv);
}

async function main() {
  await addChangeStatusDate();
}

export async function addChangeStatusDate() {
  const repo = new WorksheetRepository();
  const worksheetIds = await repo.getAllIds();
  const options = {concurrency: 2};

  return Promise.map(worksheetIds, formatByBuildingAddress, options);
}

async function formatByBuildingAddress(worksheetId) {
  const worksheet = await findWorksheetById(worksheetId);
  const updatedWorksheet = worksheet.setStatusChangedAt(worksheet.viewedAt);

  return updateWorksheet(updatedWorksheet);
}

async function findWorksheetById(buildingId) {
  const repo = new WorksheetRepository();
  return repo.findByIdOrThrow(buildingId);
}

async function updateWorksheet(worksheet) {
  const repo = new WorksheetRepository();
  return repo.save(worksheet, false);
}

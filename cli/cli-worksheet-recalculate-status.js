#!/usr/bin/env babel-node

import debug from 'debug';
import program from 'commander';
import {actionWrapper} from './lib';
import {WorksheetRepository} from '../src/worksheet/models/worksheet';
import {newWorksheet} from '../src/types/worksheet';

const debugCommand = debug('app:cli:worksheet-recalculate-status');

if (require.main === module) {
  program
    .option('-S --status <status>', 'fija la worksheet a este estado en vez del calculado')
    .option('-W --worksheet <worksheet>', 'worksheet id')
    .version('0.0.1')
    .action(actionWrapper(main))
    .parse(process.argv);
}

async function main() {
  const worksheetId = program.worksheet;

  if (!worksheetId) {
    program.help();
  }

  const repo = new WorksheetRepository();
  const data = await repo.findByIdWIthIncludes(worksheetId);
  const calculateStatus = await repo.calculateFixedStatus(data);
  const worksheet = newWorksheet(data);

  if (program.status) {
    const worksheetWithFixedStatus = worksheet.fixStatus(program.status);
    await repo.save(worksheetWithFixedStatus, false);
    debugCommand(`worksheet ${worksheetId} with status ${worksheet.status}, calculate status ${calculateStatus}, fix status to: ${program.status}`);
  } else {
    const worksheetWithCalculateStatus = worksheet.fixStatus(calculateStatus);
    await repo.save(worksheetWithCalculateStatus, false);
    debugCommand(`worksheet ${worksheetId} with status ${worksheet.status}, fix status to: ${calculateStatus}`);
  }
}

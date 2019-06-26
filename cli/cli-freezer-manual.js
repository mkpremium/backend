#!/usr/bin/env babel-node
import '../src/types';
import program from 'commander';
import {actionWrapper} from './lib';
import {moveWorksheetOutOfFreezer} from '../src/business/worksheets/freezer';

if (require.main === module) {
  program
    .arguments('')
    .option('--dry-run', 'No realiza los cambios de estados')
    .option('--limit <limit>', 'Limite', 100)
    .version('0.0.1')
    .action(actionWrapper(main))
    .parse(process.argv);
}

async function main() {
  await moveWorksheetOutOfFreezer(program.dryRun, program.limit);
}

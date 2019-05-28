#!/usr/bin/env babel-node

import program from 'commander';
import {actionWrapper} from './lib';
import {SystemPreferencesRepository} from '../src/system-preferences/models';

program
  .version('0.0.1')
  .option('-e --enable')
  .option('-d --disable')
  .action(actionWrapper(main))
  .parse(process.argv);

async function main() {
  if (program.enable) {
    return maintenanceMode(true);
  }

  if (program.disable) {
    return maintenanceMode(false);
  }

  program.help();
}

async function maintenanceMode(enabled) {
  const pref = await SystemPreferencesRepository.getPreferences();
  const updatedPref = pref.setMaintenanceMode(enabled);
  return SystemPreferencesRepository.writePreferences(updatedPref);
}

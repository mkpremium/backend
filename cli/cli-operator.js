#!/usr/bin/env babel-node

import program from 'commander';
import {actionWrapper} from './lib';

program
  .version('0.0.1')
  .action(actionWrapper(mainAction))
  .parse(process.argv);

async function mainAction() {

}

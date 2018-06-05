import gearman from 'gearmanode';
import {wrap} from '../../lib/workers';
import {gearmanConfig} from '../../../config';

import {seed} from '../../../migrations/seed_all';

const worker = gearman.worker(gearmanConfig);

async function seedJobFunc(files) {
  await seed(files);
}

worker.addFunction('seed', wrap(seedJobFunc));

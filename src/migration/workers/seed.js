import gearman from 'gearmanode';
import {gearmanConfig} from '../../../config';

import {seed} from '../../../migrations/seed_all';

const worker = gearman.worker(gearmanConfig);

function seedJobFunc(job) {
  const files = JSON.parse(job.payload);
  seed(files)
    .then(() => {
      job.workComplete();
    })
    .catch(err => {
      console.error(err);
      job.reportError();
    });
}

worker.addFunction('seed', seedJobFunc);

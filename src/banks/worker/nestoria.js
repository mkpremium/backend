import gearman from 'gearmanode';
import {gearmanConfig} from '../../../config';
import {wrap} from '../../lib/workers';

const worker = gearman.worker(gearmanConfig);

async function workerNestoria(payload) {

}

worker.addFunction('nestoria', wrap(workerNestoria), {});

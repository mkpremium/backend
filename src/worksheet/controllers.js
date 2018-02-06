import t from 'tcomb';
import {wrap} from 'express-promise-wrap';
import {WorksheetRepository} from './models/worksheet';
import {WorksheetQueueRepository} from './models/queue';

async function worksheetList(req, res) {
  const params = new t.ListQuery(req.query || {});
  const repo = new WorksheetRepository();
  const qb = repo.getQueryBuilder('select')
    .limit(params.limit)
    .offset(params.offset);
  const worksheets = await repo.query(qb);

  res.json(worksheets);
}

async function findById(req, res) {
  const id = req.params.id;
  const repo = new WorksheetRepository();
  const worksheet = await repo.findById(id);
  if (worksheet) {
    return res.json(worksheet);
  }

  const e = new Error(`worksheet ${id} no encontrada`);
  e.code = 404;
  throw e;
}

async function queueByCity(req, res) {
  const cityName = req.params.city;
  const repo = new WorksheetQueueRepository();
  const queue = await repo.findByCity(cityName);
  res.json(queue);
}

async function queueList(req, res) {
  const params = new t.ListQuery(req.query || {});
  const repo = new WorksheetQueueRepository();
  const qb = repo.getQueryBuilder('select')
    .limit(params.limit)
    .offset(params.offset);
  const queues = await repo.query(qb);

  res.json(queues);
}

export const worksheetListController = wrap(worksheetList);
export const worksheetFindByIdController = wrap(findById);
export const queueByCityController = wrap(queueByCity);
export const queueListController = wrap(queueList);

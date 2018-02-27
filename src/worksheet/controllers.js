import t from 'tcomb';
import {wrap} from 'express-promise-wrap';
import {WorksheetRepository} from './models/worksheet';
import {WorksheetQueueRepository} from './models/queue';
import {QueueRequestAction} from './types';
import {OperatorRoles} from '../types/operator';

async function worksheetList(req, res) {
  const repo = new WorksheetRepository();
  const worksheets = await repo.list(req.query);

  res.json(worksheets);
}

async function findById(req, res) {
  const id = req.params.id;
  const repo = new WorksheetRepository();
  const worksheet = await repo.findByIdWIthIncludes(id);
  res.json(worksheet);
}

async function queueByCity(req, res) {
  const cityName = req.params.city;
  const repo = new WorksheetQueueRepository();
  const queue = await repo.findByCity(cityName);
  res.json(queue);
}

async function queueList(req, res) {
  const repo = new WorksheetQueueRepository();
  const queues = await repo.list(req.query);

  res.json(queues);
}

async function actionsOnWorksheetQueue(req, res) {
  const cityName = req.params.city;
  const params = t.QueueRequestParams(req.body);
  const repo = new WorksheetQueueRepository();
  const queue = await repo.findByCity(cityName);

  switch (params.action) {
    case QueueRequestAction.TAKE:
      const worksheet = await repo.takeWorksheetInQueue(queue, params.queueItemId, req.user.id);
      return res.json(worksheet);
    case QueueRequestAction.RELEASE:
      await repo.releaseWorksheetInQueue(queue, params.queueItemId, req.user.id);
      return res.status(204).send();
  }
}

function operatorIdByPermissions(req) {
  const allowQuery = req.user.permissions.indexOf(OperatorRoles.MANAGER) !== -1;
  return allowQuery
    ? req.query.operationId || req.user.id
    : req.user.id;
}

async function queueTakenFindByOperator(req, res) {
  const operatorId = operatorIdByPermissions(req);
  const cityName = req.params.city;
  const repo = new WorksheetQueueRepository();
  const queue = await repo.findByCity(cityName);

  const queueItem = queue.findItemByOperatorId(operatorId);
  res.json(queueItem || {});
}

export const worksheetListController = wrap(worksheetList);
export const worksheetFindByIdController = wrap(findById);
export const queueByCityController = wrap(queueByCity);
export const queueListController = wrap(queueList);
export const actionsOnWorksheetQueueController = wrap(actionsOnWorksheetQueue);
export const queueTakenFindByOperatorController = wrap(queueTakenFindByOperator);

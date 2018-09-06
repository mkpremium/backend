import {wrap} from 'express-promise-wrap';

import {OperatorRepository} from '../operator/models';

async function overAll(req, res) {
  const operatorRepo = new OperatorRepository();
  const results = await operatorRepo.listWithStats(req.query);
  res.json(results);
}

async function performance(req, res) {
  const operatorRepo = new OperatorRepository();
  const results = await operatorRepo.listWithPerformance(req.query);
  res.json(results);
}

export const overAllController = wrap(overAll);
export const performanceController = wrap(performance);

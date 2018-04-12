import {wrap} from 'express-promise-wrap';

import {OperatorRepository} from '../operator/models';

async function overAll(req, res) {
  const operatorRepo = new OperatorRepository();
  const results = await operatorRepo.listWithStats();
  res.json(results);
}

export const overAllController = wrap(overAll);

import {wrap} from 'express-promise-wrap';

import {StatsRepository} from './models';

async function overAll(req, res) {
  const statsRepo = new StatsRepository();
  const results = await statsRepo.getOverAll();
  res.json(results);
}

export const overAllController = wrap(overAll);

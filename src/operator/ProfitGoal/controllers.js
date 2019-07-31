import {wrap} from 'express-promise-wrap';

import {setProfitGoalToOperator} from './application';

async function setProfitGoalToOperatorFromRequest(req, res) {
  const result = await setProfitGoalToOperator(req.body);
  res.json(201).send(result);
}

export const setProfitGoalToOperatorController = wrap(setProfitGoalToOperatorFromRequest);

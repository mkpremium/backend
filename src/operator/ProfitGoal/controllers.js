import {wrap} from 'express-promise-wrap';

import {setProfitGoalToOperator} from './application';

async function setProfitGoalToOperatorFromRequest(req, res) {
  const result = await setProfitGoalToOperator(req.body.operatorId, req.body.profitAmount);
  res.json(201).send(result);
}

export const setProfitGoalToOperatorController = wrap(setProfitGoalToOperatorFromRequest);

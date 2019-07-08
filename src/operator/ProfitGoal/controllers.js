import {wrap} from 'express-promise-wrap';

import {setProfitGoalToOperator} from './application';

async function setProfitGoalToOperatorFromRequest(req, res) {
  const result = setProfitGoalToOperator(req.operatorId, req.profitAmount);
  res.json(201).send(result);
}

export const setProfitGoalToOperatorController = wrap(setProfitGoalToOperatorFromRequest);

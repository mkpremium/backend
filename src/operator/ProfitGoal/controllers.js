import { wrap } from 'express-promise-wrap'

import { setProfitGoalToOperator } from './application'

async function setProfitGoalToOperatorFromRequest (req, res) {
  const result = await setProfitGoalToOperator(req.body)
  res.status(201).json(result)
}

export const setProfitGoalToOperatorController = wrap(setProfitGoalToOperatorFromRequest)

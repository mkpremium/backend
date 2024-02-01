import { setProfitGoalToOperator } from './application'

export function setProfitGoalToOperatorControllerFactory (operatorRepository) {
  return async function setProfitGoalToOperatorController (req, res) {
    const result = await setProfitGoalToOperator(req.body, operatorRepository)
    res.status(201).json(result)
  }
}

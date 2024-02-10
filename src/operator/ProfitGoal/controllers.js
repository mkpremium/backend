import { setProfitGoalToOperator } from './application'

export function setProfitGoalToOperatorControllerFactory (usersRepository) {
  return async function setProfitGoalToOperatorController (req, res) {
    const result = await setProfitGoalToOperator(req.body, usersRepository)
    res.status(201).json(result)
  }
}

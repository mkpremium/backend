import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'

import { ProfitGoalRequest } from './types'

export async function setProfitGoalToOperator (data, usersRepository, now = () => new Date()) {
  const { operatorId, profitAmount } = fromJSON(data, ProfitGoalRequest)

  const operator = await usersRepository.get(operatorId)

  const profitGoal = {
    amount: profitAmount,
    updatedAt: now()
  }

  const updatedOperator = t.update(operator, { profitGoal: { $set: profitGoal } })

  return usersRepository.save(updatedOperator)
}

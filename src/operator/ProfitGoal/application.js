import { OperatorRepository } from '../models'
import t from 'tcomb'
import { ProfitGoalFirebaseRepository } from './models'
import fromJSON from 'tcomb/lib/fromJSON'

import { ProfitGoalRequest } from './types'

// TODO Should validate that operator has BUSINESS role
export async function setProfitGoalToOperator (data) {
  const { operatorId, profitAmount } = fromJSON(data, ProfitGoalRequest)

  const operatorRepository = new OperatorRepository()

  const operator = await operatorRepository.findByIdOrThrow(operatorId)

  const profitGoal = {
    amount: profitAmount,
    updatedAt: new Date()
  }

  const updatedOperator = t.update(operator, { profitGoal: { $set: profitGoal } })

  const result = await operatorRepository.save(updatedOperator)

  const profitGoalFirebaseRepository = new ProfitGoalFirebaseRepository()
  await profitGoalFirebaseRepository.saveProfitGoalToFirebaseUser(profitGoal, operator.id)

  return result
}

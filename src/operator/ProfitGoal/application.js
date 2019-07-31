import {OperatorRepository} from '../models';
import t from 'tcomb';
import {ProfitGoalFirebaseRepository} from './models';
import fromJSON from 'tcomb/lib/fromJSON';

import {ProfitGoalRequest} from './types';

export async function setProfitGoalToOperator(data) {
  const {operatorId, profitAmount } = fromJSON(data, ProfitGoalRequest);

  const operatorRepository = new OperatorRepository();

  const profitGoalFirebaseRepository = new ProfitGoalFirebaseRepository();

  const operator = await operatorRepository.findByIdOrThrow(operatorId);

  let profitGoal = {
    amount: profitAmount,
    updatedAt: new Date()
  };

  const updatedOperator = t.update(operator, {profitGoal: {$set: profitGoal}});

  const result = await operatorRepository.save(updatedOperator);

  await profitGoalFirebaseRepository.saveProfitGoalToFirebaseUser(profitGoal, operator.id);

  return result;
}

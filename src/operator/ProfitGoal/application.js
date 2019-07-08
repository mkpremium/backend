import {OperatorRepository} from '../models';
import t from 'tcomb';

export async function setProfitGoalToOperator(operatorId, profitAmount) {
  const operatorRepository = new OperatorRepository();

  const operator = await operatorRepository.findByIdOrThrow(operatorId);

  let profitGoal = {
    amount: profitAmount,
    updatedAt: new Date()
  };

  const updatedOperator = t.update(operator, {profitGoal: {$set: profitGoal}});

  return operatorRepository.save(updatedOperator);
}

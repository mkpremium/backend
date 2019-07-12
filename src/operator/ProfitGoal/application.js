import {OperatorRepository} from '../models';
import t from 'tcomb';
import {ProfitGoalFirebaseRepository} from './models';

export async function setProfitGoalToOperator(operatorId, profitAmount) {
  const operatorRepository = new OperatorRepository();

  const operator = await operatorRepository.findByIdOrThrow(operatorId);

  let profitGoal = {
    amount: profitAmount,
    updatedAt: new Date()
  };

  const updatedOperator = t.update(operator, {profitGoal: {$set: profitGoal}});

  const profitGoalFirebaseRepository = new ProfitGoalFirebaseRepository();

  await profitGoalFirebaseRepository.saveProfitGoalToFirebaseUser(profitGoal, operator.id);

  return operatorRepository.save(updatedOperator);
}

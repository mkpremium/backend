import {deleteAll, operatorCreate} from '../../common';
import {setProfitGoalToOperator} from '../../../src/operator/application';
import {expect} from 'chai';

describe('profit goals', () => {
  let operator;
  before(async() => {
    await deleteAll();
    operator = await operatorCreate();
    console.log(operator);
  });

  it('Should define a goal for an existing operator', async() => {
    const result = await setProfitGoalToOperator(operator.id, 1500);

    expect(result.profitGoal).to.not.be.null;
    expect(result.profitGoal.amount).to.equal(1500);
  });

  it('Should fail a goal for an non existing operator', async() => {
    let error;
    try {
      await setProfitGoalToOperator('fakeId', 1500);
    } catch (err) {
      error = err;
    }

    expect(error).to.not.be.null;
    expect(error.message).to.equal('El operator fakeId no existe');
    expect(error.code).to.equal(404);
  });
});

import {deleteAll, operatorCreate} from '../../common';
import {setProfitGoalToOperator} from '../../../src/operator/ProfitGoal/application';
import {expect} from 'chai';
import {
  closeSellStock,
  createPurchaseStock,
  getProfitGoalOperatorsRanking,
  sellPurchasedStock
} from '../../../src/stock/application';
import {OperatorRepository} from '../../../src/operator/models';
import {StockRepository} from '../../../src/stock/models';
import {BuildingRepository} from '../../../src/building/models';
import {buildingData} from '../../stock/stock.mock';

describe('profit goals', () => {
  let operator;
  let testBuilding;
  before(async() => {
    const operatorRepository = new OperatorRepository();
    await operatorRepository.deleteQuery();
    operator = await operatorCreate();

    testBuilding = await BuildingRepository.createNewBuilding(buildingData);

    let params = {
      buildingId: testBuilding.id,
      reservationAmount: 1110.00,
      reservationDate: '2019-07-11T13:00:00.000Z',
      transactionAmount: 1500.00,
      transactionDate: '2019-07-11T13:00:00.000Z'
    };
    await createPurchaseStock(params, operator.id);

    params = {
      buildingId: testBuilding.id,
      reservationAmount: 2000.00,
      reservationDate: '2019-07-11T13:00:00.000Z',
      transactionAmount: 3000.00,
      transactionDate: '2019-07-11T13:00:00.000Z'
    };
    await sellPurchasedStock(params, operator.id);

    params = {
      buildingId: testBuilding.id
    };
    await closeSellStock(params, operator.id);
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

  it('Should display a profit goal ranking', async() => {
    const profitRanking = await getProfitGoalOperatorsRanking();
    expect(profitRanking.length).to.be.equal(1);
  });
});

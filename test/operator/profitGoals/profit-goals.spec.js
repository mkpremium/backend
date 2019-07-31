import {deleteAll, operatorCreate, operatorLogin} from '../../common';
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
import {madrid} from '../../../src/lib/date';
import app from '../../../src/app';
import request from 'supertest';

describe('profit goals', () => {
  let operator1;
  let operator2;
  let operator3;
  let testBuilding1;
  let testBuilding2;

  let authenticatedOperator;

  async function createTestPurchaseStock(buildingId, operatorId, transactionAmount) {
    let params = {
      buildingId: buildingId,
      reservationAmount: 1110.00,
      reservationDate: '2019-07-11T13:00:00.000Z',
      transactionAmount: transactionAmount,
      transactionDate: '2019-07-11T13:00:00.000Z'
    };
    await createPurchaseStock(params, operatorId);
  }

  async function sellTestPurchaseStock(buildingId, operatorId, transactionAmount) {
    let params = {
      buildingId: buildingId,
      reservationAmount: 2000.00,
      reservationDate: '2019-07-11T13:00:00.000Z',
      transactionAmount: transactionAmount,
      transactionDate: '2019-07-11T13:00:00.000Z'
    };
    await sellPurchasedStock(params, operatorId);
  }

  before(async() => {
    const buildingRepository = new BuildingRepository();
    await buildingRepository.deleteQuery();

    const stockRepository = new StockRepository();
    await stockRepository.deleteQuery();

    const operatorRepository = new OperatorRepository();
    await operatorRepository.deleteQuery();

    operator1 = await operatorCreate(madrid().unix());

    operator2 = await operatorCreate(madrid().unix() + 1);

    operator3 = await operatorCreate(madrid().unix() + 2);

    authenticatedOperator = await operatorLogin(app, {username: operator3.username, password: 'Passw0rd'});

    testBuilding1 = await BuildingRepository.createNewBuilding(buildingData);

    await createTestPurchaseStock(testBuilding1.id, operator1.id, 1500);
    await sellTestPurchaseStock(testBuilding1.id, operator1.id, 3000);
  });

  it('Should define a goal for an existing operator1', async() => {
    const result = await setProfitGoalToOperator({operatorId: operator1.id, profitAmount: 1500});
    expect(result.profitGoal).to.not.be.null;
    expect(result.profitGoal.amount).to.equal(1500);
  });

  it('Should fail a goal for an non existing operator1', async() => {
    let error;
    try {
      const operator = await setProfitGoalToOperator({operatorId: 'fakeId', profitAmount: 1500});
      console.log(operator);
    } catch (err) {
      error = err;
    }

    expect(error).to.not.be.null;
    expect(error.message).to.equal('El operator fakeId no existe');
    expect(error.code).to.equal(404);
  });

  it('Should display a profit goal ranking', async() => {
    await setProfitGoalToOperator({ operatorId: operator2.id, profitAmount: 1500});

    let params = {
      buildingId: testBuilding1.id
    };
    await closeSellStock(params, operator1.id);

    testBuilding2 = await BuildingRepository.createNewBuilding(buildingData);
    await createTestPurchaseStock(testBuilding2.id, operator2.id, 1000);
    await sellTestPurchaseStock(testBuilding2.id, operator2.id, 1200);

    params = {
      buildingId: testBuilding2.id
    };
    await closeSellStock(params, operator2.id);

    const profitRanking = await getProfitGoalOperatorsRanking();
    console.log(profitRanking);
    expect(profitRanking.length).to.be.greaterThan(0);
    expect(profitRanking.find(u => u.userId === operator1.id)).to.not.be.equal(null);
  });

  it('Should set a profit goal via @POST request', async() => {
    await request(app)
      .post('/operators/profit/goal')
      .set('Authorization', authenticatedOperator.authorization)
      .send({
        profitAmount: 1500,
        operatorId: operator3.id
      })
      .expect(200);
  });
});

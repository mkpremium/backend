import {operatorCreate} from '../common';

import {expect} from 'chai';
import {
  closeSellStock,
  createPurchaseStock,
  getProfitGoalOperatorsRanking,
  sellPurchasedStock
} from '../../src/stock/application';
import {BuildingRepository} from '../../src/building/models';
import {buildingData} from './stock.mock';
import {StockStatuses} from '../../src/stock/types';
import {StockRepository} from '../../src/stock/models';
import {madrid} from '../../src/lib/date';

describe('building stock ', () => {
  let testBuilding;
  let testBuilding2;
  let operator;

  before(async() => {
    const stock = new StockRepository();
    await stock.deleteQuery();
    testBuilding = await BuildingRepository.createNewBuilding(buildingData);
    testBuilding2 = await BuildingRepository.createNewBuilding(buildingData);

    operator = await operatorCreate(madrid().unix());
  });

  it('createPurchaseStock should create a valid stock ', async() => {

    const params = {
      buildingId: testBuilding.id,
      reservationAmount: 1110.00,
      reservationDate: '2019-07-11T13:00:00.000Z',
      transactionAmount: 1500.00,
      transactionDate: '2019-07-11T13:00:00.000Z'
    };
    const stock = await createPurchaseStock(params, operator.id);
    expect(stock).to.not.be.null;
    expect(stock.currentStatus).to.equals(StockStatuses.PURCHASE);
  });

  it('Should sell stock from previous purchase stock', async() => {

    const params = {
      buildingId: testBuilding.id,
      reservationAmount: 2000.00,
      reservationDate: '2019-07-11T13:00:00.000Z',
      transactionAmount: 3000.00,
      transactionDate: '2019-07-11T13:00:00.000Z'
    };
    const stock = await sellPurchasedStock(params, operator.id);
    expect(stock).to.not.be.null;
    expect(stock.currentStatus).to.equals(StockStatuses.SELL);
  });

  it('Should not find a valid stock object', async() => {

    const params = {
      buildingId: testBuilding2.id,
      reservationAmount: 2000.00,
      reservationDate: '2019-07-11T13:00:00.000Z',
      transactionAmount: 3000.00,
      transactionDate: '2019-07-11T13:00:00.000Z'
    };

    let error;
    try {
      await sellPurchasedStock(params, operator.id);
    } catch (err) {
      error = err;
    }
    expect(error).to.not.be.null;
  });

  it('Should close a stock', async() => {

    const body = { buildingId: testBuilding.id };
    const stock = await closeSellStock(body, operator.id);

    expect(stock).to.not.be.null;
    expect(stock.close.gain).to.equals(1500.00);
    expect(stock.currentStatus).to.equals(StockStatuses.CLOSE);
  });

  it('createPurchaseStock should fail with invalid building', async() => {

    const params = {
      buildingId: 'randomFakeId',
      reservationAmount: 1110.00,
      reservationDate: '2019-07-11T13:00:00.000Z',
      transactionAmount: 1500.00,
      transactionDate: '2019-07-11T13:00:00.000Z'
    };

    let error;
    try {
      await createPurchaseStock(params, operator.id);
    } catch (err) {
      error = err;
    }
    expect(error).to.not.be.null;
    expect(error.code).to.equals(404);
    expect(error.message).to.equals('El edificio randomFakeId no existe');
  });

  it('Sell Stock should fail with invalid building id', async() => {

    const params = {
      buildingId: 'randomFakeId',
      reservationAmount: 2000.00,
      reservationDate: '2019-07-11T13:00:00.000Z',
      transactionAmount: 3000.00,
      transactionDate: '2019-07-11T13:00:00.000Z'
    };

    let error;
    try {
      await sellPurchasedStock(params, operator.id);
    } catch (err) {
      error = err;
    }
    expect(error).to.not.be.null;
    expect(error.code).to.equals(404);
    expect(error.message).to.equals('El edificio randomFakeId no existe');
  });

  it('Should close a stock fail on invalid building id', async() => {

    const body = { buildingId: 'randomFakeId' };

    let error;
    try {
      await closeSellStock(body, operator.id);
    } catch (err) {
      error = err;
    }
    expect(error).to.not.be.null;
    expect(error.code).to.equals(404);
    expect(error.message).to.equals('El edificio randomFakeId no existe');
  });

});

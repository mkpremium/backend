import {deleteAll} from '../common';
import {StockRepository} from '../../src/stock/models';
import {expect} from 'chai';
import {createPurchaseStock, sellPurchasedBuilding} from '../../src/stock/application';
import {BuildingRepository} from '../../src/building/models';
import {buildingData} from './stock.mock';
import {newHttpError} from '../../src/lib/http-error';

describe('building stock ', () => {
  let testBuilding;

  before(async() => {
    await deleteAll();
  });

  it('createPurchaseStock should fail with invalid building', async() => {
    const operatorId = '111111';
    const params = {
      buildingId: 'randomFakeId',
      reservationAmount: 1110.00,
      reservationDate: new Date(),
      transactionAmount: 1500.00,
      transactionDate: new Date()
    };

    try {
      await createPurchaseStock(params, operatorId);
    } catch (err) {
      expect(err.code).to.equals(404);
      expect(err.message).to.equals('El edificio randomFakeId no existe');
    }
  });

  it('createPurchaseStock should create a valid stock ', async() => {
    testBuilding = await BuildingRepository.createNewBuilding(buildingData);
    const operatorId = '111111';
    const params = {
      buildingId: testBuilding.id,
      reservationAmount: 1110.00,
      reservationDate: new Date(),
      transactionAmount: 1500.00,
      transactionDate: new Date()
    };
    const stock = await createPurchaseStock(params, operatorId);
    expect(stock).to.not.be.null;
  });

  it('Should sell stock from previous purchase stock', async() => {
    const operatorId = '111111';
    const params = {
      buildingId: testBuilding.id,
      reservationAmount: 2000.00,
      reservationDate: new Date(),
      transactionAmount: 3000.00,
      transactionDate: new Date()
    };
    const stock = await sellPurchasedBuilding(params, operatorId);
    console.log(stock);
    expect(stock).to.not.be.null;
  });

  it('Sell Stock should fail with invalid building id', async() => {
    const operatorId = '111111';
    const params = {
      buildingId: 'randomFakeId',
      reservationAmount: 2000.00,
      reservationDate: new Date(),
      transactionAmount: 3000.00,
      transactionDate: new Date()
    };

    try {
      await sellPurchasedBuilding(params, operatorId);
    } catch (err) {
      expect(err.code).to.equals(404);
      expect(err.message).to.equals('El edificio randomFakeId no existe');
    }
  });
});

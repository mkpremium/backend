import {deleteAll} from '../common';
import {StockRepository} from '../../src/stock/models';
import {expect} from 'chai';

describe('building stock ', () => {
  before(async() => {
    await deleteAll();
  });

  it('TransactionModel repository should create an object ', async() => {
    const stockRepository = new StockRepository();
    const operatorId = '111111';
    const params = {
      buildingId: '1235567',
      reservationAmount: 1110.00,
      reservationDate: new Date(),
      transactionAmount: 1500.00,
      transactionDate: new Date()
    };
    const stock = await stockRepository.createPurchaseStock(params, operatorId);
    console.log(stock);
    expect(stock).to.not.be.null;
  });
});

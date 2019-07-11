
import {CouchbaseModel} from '../db/model';
import {Stock} from './types';
import fromJSON from 'tcomb/lib/fromJSON';
import _head from 'lodash/head';
import t from 'tcomb';
import {fbComerciales} from '../firebase/index';
import {madrid} from '../lib/date';

export class StockRepository extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = Stock;
  }

  async findByBuildingId(buildingId) {
    const qb = this.getQueryBuilder()
      .where('t.`buildingId` = ? ', buildingId);

    const results = await this.query(qb);

    if (results.length > 0) {
      return fromJSON(_head(results), Stock);
    }
  }

  async findByBuildingIdOrThrow(buildingId) {
    const result = await this.findByBuildingId(buildingId);
    if (!result) {
      throw new Error(`No existe un stock asociado a ${buildingId}`);
    }
    return result;
  }

  async listProfitRankings(params) {
    const year = new Date().getFullYear();
    const query = `
      SELECT close.operatorId, SUM(close.gain) as total
      FROM mkpremium
      WHERE _documentType = 'stock'
      AND close IS NOT NULL
      AND DATE_PART_STR(close.transactionDate,'year') = ${year}
      GROUP BY close.operatorId
      ORDER BY total
      `;
    return this.raw(query);
  }
}

export class StockFirebaseRepository {
  constructor() {
    this.db = fbComerciales.database();
  }

  async savePurchaseStock(stock) {
    const stockRef = await this.getStockReference(stock.purchase.operatorId, stock.buildingId);
    const firebasePurchaseTransaction = this.toFirebaseTransaction(stock.purchase);
    console.log('Firebase ùirchase', firebasePurchaseTransaction);
    return stockRef.child('purchase').set(firebasePurchaseTransaction);
  }

  async saveSellStock(stock) {
    const stockRef = await this.getStockReference(stock.purchase.operatorId, stock.buildingId);
    const firebaseSellTransaction = this.toFirebaseTransaction(stock.sell);
    return stockRef.child('sell').set(firebaseSellTransaction);
  }

  async saveCloseStock(stock) {
    const stockRef = await this.getStockReference(stock.purchase.operatorId, stock.buildingId);
    const firebaseClose = this.toFirebaseClose(stock.close);
    return stockRef.child('close').set(firebaseClose);
  }

  getStockReference(operatorId, buildingId) {
    return this.db.ref(`${fbComerciales.prefixURL}Users/${operatorId}/Buildings/${buildingId}/Stock`);
  }

  toFirebaseTransaction(transaction) {
    return {
      reservationDate: madrid(transaction.reservationDate).unix(),
      reservationAmount: transaction.reservationAmount,
      transactionDate: madrid(transaction.transactionDate).unix(),
      transactionAmount: transaction.transactionAmount
    };
  }

  toFirebaseClose(close) {
    return {
      gain: close.gain,
      transactionDate: madrid(close.transactionDate).unix()
    };
  }
}

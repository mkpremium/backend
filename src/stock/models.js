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

  async findByBuildingIdOrDefault(buildingId) {
    const result = await this.findByBuildingId(buildingId);
    if (!result) {
      console.log(`No existe un stock asociado a ${buildingId}`);
      return null;
    }
    return result;
  }

  async findByBuildingIdOrThrow(buildingId) {
    const result = await this.findByBuildingId(buildingId);
    if (!result) {
      throw new Error(`No existe un stock asociado a ${buildingId}`);
    }
    return result;
  }

  async listProfitRankings(params) {
    const currentYear = new Date().getFullYear();
    const profitsQuery = `
      SELECT close.operatorId, SUM(close.gain) as total
      FROM mkpremium
      WHERE _documentType = 'stock'
      AND close IS NOT NULL
      AND DATE_PART_STR(close.transactionDate,'year') = ${currentYear}
      GROUP BY close.operatorId
      ORDER BY total
      `;

    return this.raw(profitsQuery);
  }
}

export class StockFirebaseRepository {
  constructor() {
    if (!fbComerciales.enabled) {
      return;
    }
    this.db = fbComerciales.database();
  }

  async savePurchaseStock(stock) {
    if (!fbComerciales.enabled) {
      return;
    }
    const stockRef = await this.getStockReference(stock.purchase.operatorId, stock.buildingId);
    const firebasePurchaseTransaction = this.toFirebaseTransaction(stock.purchase);
    return stockRef.child('purchase').set(firebasePurchaseTransaction);
  }

  async saveSellStock(stock) {
    if (!fbComerciales.enabled) {
      return;
    }
    const stockRef = await this.getStockReference(stock.purchase.operatorId, stock.buildingId);
    const firebaseSellTransaction = this.toFirebaseTransaction(stock.sell);
    return stockRef.child('sell').set(firebaseSellTransaction);
  }

  async saveCloseStock(stock) {
    if (!fbComerciales.enabled) {
      return;
    }
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

  async deleteSellStock(stock) {
    if (!fbComerciales.enabled) {
      return;
    }
    const stockRef = await this.getStockReference(stock.purchase.operatorId, stock.buildingId);
    return stockRef.child('sell').remove();
  }
}

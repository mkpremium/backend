import t from 'tcomb'
import type { Transaction as ITransaction } from './stock.entity'

export const Transaction = t.struct<ITransaction>({
  flipperOrUserId: t.String,
  reservationAmount: t.Number,
  reservationDate: t.Date,
  transactionAmount: t.Number,
  transactionDate: t.Date
}, 'Transaction')

export const StockStatuses = {
  PURCHASE: 'PURCHASE',
  SELL: 'SELL',
  CLOSE: 'CLOSE'
}

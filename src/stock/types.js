import t from 'tcomb'

export const Transaction = t.struct({
  operatorId: t.String,
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
const StockStatus = t.enums.of(Object.values(StockStatuses))

export const Stock = t.struct({
  id: t.maybe(t.String),
  buildingId: t.String,
  currentStatus: StockStatus,
  purchase: Transaction,
  sell: t.maybe(Transaction),
  close: t.maybe(t.struct({
    operatorId: t.String,
    gain: t.Number,
    transactionDate: t.Date
  })),
  _documentType: t.String
}, {
  name: 'Stock',
  defaultProps: {
    _documentType: 'stock'
  }
})

export const TransactionParams = t.struct({
  buildingId: t.String,
  reservationAmount: t.Number,
  reservationDate: t.Date,
  transactionAmount: t.Number,
  transactionDate: t.Date
})

export default t

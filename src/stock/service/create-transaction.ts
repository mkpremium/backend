import { User } from '../../user/user.entity'
import { StockTransaction } from '../stock-transaction.entity'
import { Transaction as ITransaction } from '../stock.entity'

export type TransactionInput = ITransaction & {
  reservationDate: string,
  transactionDate: string
}

export function createTransaction (params: TransactionInput, flipperOrUserId: string) {
  const stockTransaction = new StockTransaction()
  const user = new User()
  user.id = flipperOrUserId
  stockTransaction.flipperOrUser = user
  stockTransaction.reservationAmount = params.reservationAmount
  stockTransaction.reservationDate = new Date(params.reservationDate)
  stockTransaction.transactionAmount = params.transactionAmount
  stockTransaction.transactionDate = new Date(params.transactionDate)
  return stockTransaction
}

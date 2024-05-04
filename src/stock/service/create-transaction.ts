import { Transaction } from '../types'
import { Transaction as ITransaction } from '../stock.entity'

export type TransactionInput = ITransaction & {
  reservationDate: string,
  transactionDate: string
}

export function createTransaction (params: TransactionInput, flipperOrUserId: string) {
  return Transaction({
    flipperOrUserId,
    reservationAmount: params.reservationAmount,
    reservationDate: new Date(params.reservationDate),
    transactionAmount: params.transactionAmount,
    transactionDate: new Date(params.transactionDate)
  })
}

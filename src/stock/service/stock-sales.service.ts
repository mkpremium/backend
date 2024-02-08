import type { TransactionInput } from './create-transaction'
import type { Stock } from '../stock.entity'

export interface StockSalesService {
  sellStock (params: { buildingId: string } & TransactionInput, operatorId: string): Promise<Stock>

  updatePurchaseStock (params: { buildingId: string } & TransactionInput, operatorId: string): Promise<Stock>

  updateSellStock (params: { buildingId: string } & TransactionInput, operatorId: string): Promise<Stock>
}

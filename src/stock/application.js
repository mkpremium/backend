import t from 'tcomb'
import { LegacyBuildingRepository } from '../building/models'
import { StockRepository } from './models'
import { StockStatuses } from './types'

export async function closeSellStock (params, operatorId) {
  const legacyBuildingRepository = new LegacyBuildingRepository()

  await legacyBuildingRepository.findByIdOrThrow(params.buildingId)

  const stockRepository = new StockRepository()
  const stock = await stockRepository.findByBuildingIdOrDefault(params.buildingId)

  if (stock.currentStatus !== StockStatuses.SELL) {
    throw new Error(`El stock no se encuentra en estado ${StockStatuses.SELL}`)
  }

  const gain = stock.sell.transactionAmount - stock.purchase.transactionAmount

  const close = {
    operatorId,
    gain,
    transactionDate: new Date()
  }
  const updatedStock = t.update(stock, { close: { $set: close }, currentStatus: { $set: StockStatuses.CLOSE } })
  return stockRepository.save(updatedStock)
}

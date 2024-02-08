import t from 'tcomb'
import { LegacyBuildingRepository } from '../building/models'
import { SuperSellAward } from '../operator/Awards/SuperSellAward'
import { OperatorRepository } from '../operator/models'
import { StockRepository } from './models'
import { StockStatuses } from './types'

export async function closeSellStock (params, operatorId) {
  const legacyBuildingRepository = new LegacyBuildingRepository()

  await legacyBuildingRepository.findByIdOrThrow(params.buildingId)

  const stockRepository = new StockRepository()

  const operatorRepository = new OperatorRepository()

  const stock = await stockRepository.findByBuildingIdOrDefault(params.buildingId)

  if (stock.currentStatus !== StockStatuses.SELL) {
    throw new Error(`El stock no se encuentra en estado ${StockStatuses.SELL}`)
  }
  const operator = await operatorRepository.findByIdOrThrow(operatorId)

  const gain = stock.sell.transactionAmount - stock.purchase.transactionAmount

  if (SuperSellAward.hasSuperSellAward(gain)) {
    await operatorRepository.addAnAward(operator, SuperSellAward.getSuperSellAward())
  }

  const close = {
    operatorId,
    gain,
    transactionDate: new Date()
  }
  const updatedStock = t.update(stock, { close: { $set: close }, currentStatus: { $set: StockStatuses.CLOSE } })
  return stockRepository.save(updatedStock)
}

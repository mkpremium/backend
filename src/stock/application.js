import { TransactionParams, StockStatuses, Transaction } from './types'
import { StockFirebaseRepository, StockRepository } from './models'
import { BuildingRepository } from '../building/models'
import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import { OperatorRepository } from '../operator/models'
import { SuperSellAward } from '../operator/Awards/SuperSellAward'

function createTransaction (params = {}, operatorId) {
  return Transaction({
    operatorId: operatorId,
    reservationAmount: params.reservationAmount,
    reservationDate: new Date(params.reservationDate),
    transactionAmount: params.transactionAmount,
    transactionDate: new Date(params.transactionDate)
  })
}

export async function createPurchaseStock (params = {}, operatorId) {
  const createStockParams = fromJSON(params, TransactionParams)

  const purchase = createTransaction(params, operatorId)

  const stockRepository = new StockRepository()

  const stockExist = await stockRepository.findByBuildingIdOrDefault(params.buildingId)

  if (stockExist) {
    throw new Error('There is an stock related to that building')
  }

  const stock = {
    buildingId: createStockParams.buildingId,
    currentStatus: StockStatuses.PURCHASE,
    purchase
  }

  const result = await stockRepository.save(stock)

  const stockFirebaseRepository = new StockFirebaseRepository()
  await stockFirebaseRepository.savePurchaseStock(stock)

  return result
}

export async function updatePurchaseStock (params = {}, operatorId) {
  const purchase = createTransaction(params, operatorId)

  const stockFirebaseRepository = new StockFirebaseRepository()

  const stockRepository = new StockRepository()

  let stock = await stockRepository.findByBuildingIdOrThrow(params.buildingId)

  if (stock.currentStatus === StockStatuses.CLOSE) {
    throw new Error(`El stock se encuentra en estado ${StockStatuses.CLOSE}`)
  }

  stock = t.update(stock, {
    purchase: { $set: purchase }
  })

  const result = await stockRepository.save(stock)

  await stockFirebaseRepository.savePurchaseStock(stock)

  return result
}

export async function sellPurchasedStock (params = {}, operatorId) {
  const buildingRepository = new BuildingRepository()

  await buildingRepository.findByIdOrThrow(params.buildingId)

  const sell = createTransaction(params, operatorId)

  const stockRepository = new StockRepository()

  let stock = await stockRepository.findByBuildingIdOrThrow(params.buildingId)

  if (stock.currentStatus !== StockStatuses.PURCHASE) {
    throw new Error(`El stock no encuentra en estado ${StockStatuses.PURCHASE}`)
  }

  stock = t.update(stock, {
    sell: { $set: sell },
    currentStatus: { $set: StockStatuses.SELL }
  })

  const result = await stockRepository.save(stock)

  const stockFirebaseRepository = new StockFirebaseRepository()
  await stockFirebaseRepository.saveSellStock(stock)

  return result
}

export async function updateSellStock (params = {}, operatorId) {
  const buildingRepository = new BuildingRepository()

  const stockFirebaseRepository = new StockFirebaseRepository()

  await buildingRepository.findByIdOrThrow(params.buildingId)

  const sell = createTransaction(params, operatorId)

  const stockRepository = new StockRepository()

  let stock = await stockRepository.findByBuildingIdOrThrow(params.buildingId)
  if (stock.currentStatus === StockStatuses.CLOSE) {
    throw new Error(`El stock se encuentra en estado ${StockStatuses.CLOSE}`)
  }

  stock = t.update(stock, {
    sell: { $set: sell },
    currentStatus: { $set: StockStatuses.SELL }
  })

  const result = await stockRepository.save(stock)

  await stockFirebaseRepository.saveSellStock(stock)

  return result
}

export async function cancelSellStock (params) {
  const stockRepository = new StockRepository()

  let stock = await stockRepository.findByBuildingIdOrThrow(params.buildingId)

  if (stock.currentStatus !== StockStatuses.SELL) {
    throw new Error(`El stock no se encuentra en estado ${StockStatuses.SELL}`)
  }

  stock = t.update(stock, {
    sell: { $set: null },
    currentStatus: { $set: StockStatuses.PURCHASE }
  })

  const result = await stockRepository.save(stock)

  const stockFirebaseRepository = new StockFirebaseRepository()
  await stockFirebaseRepository.deleteSellStock(stock)

  return result
}

export async function closeSellStock (params, operatorId) {
  const buildingRepository = new BuildingRepository()

  await buildingRepository.findByIdOrThrow(params.buildingId)

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
    gain: gain,
    transactionDate: new Date()
  }
  const updatedStock = t.update(stock, { close: { $set: close }, currentStatus: { $set: StockStatuses.CLOSE } })
  const result = stockRepository.save(updatedStock)

  const stockFirebaseRepository = new StockFirebaseRepository()
  await stockFirebaseRepository.saveCloseStock(updatedStock)

  return result
}

export async function getProfitGoalOperatorsRanking () {
  const operatorRepository = new OperatorRepository()
  const operators = await operatorRepository.getOperatorsWithProfitGoal()

  const stockRepository = new StockRepository()
  const operatorsProfits = await stockRepository.listProfitRankings()

  const operatorsProfitsMap = new Map()

  for (let x = 0; x < operatorsProfits.length; x++) {
    const profit = operatorsProfits[x] ? operatorsProfits[x].total : 0
    operatorsProfitsMap.set(operatorsProfits[x].operatorId, profit)
  }

  const unsortedOperatorsRanking = operators.map((operator) => {
    const currentOperatorProfit = operatorsProfitsMap.get(operator.t.id) | 0
    const currentPercentageGoal = operator.t.profitGoal.amount > 0
      ? (currentOperatorProfit / operator.t.profitGoal.amount) : 0
    return {
      userId: operator.t.id,
      userName: operator.t.username,
      userCity: operator.t.profile.city,
      goal: operator.t.profitGoal.amount,
      currentProfit: currentOperatorProfit,
      percentageGoal: currentPercentageGoal,
      awards: operator.t.awards,
      rank: 0
    }
  })

  const sortedOperatorsRanking = unsortedOperatorsRanking
    .sort((a, b) => a.percentageGoal < b.percentageGoal)

  return sortedOperatorsRanking.map((operator, index) => {
    operator.rank = index + 1
    return operator
  })
}

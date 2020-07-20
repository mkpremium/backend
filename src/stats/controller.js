import { wrap } from 'express-promise-wrap'

import { OperatorRepository } from '../operator/models'
import { OwnerRepository } from '../owner/models'
import { OperatorStatsRepository } from './models'
import { WorksheetRepository } from '../worksheet/models/worksheet'

async function overAll (req, res) {
  const operatorRepo = new OperatorRepository()
  const results = await operatorRepo.listWithStats(req.query)
  res.json(results)
}

async function overProvinces (req, res) {
  const repo = new OperatorStatsRepository()
  const results = await repo.getProvinceStats(req.query)
  res.json(results)
}

async function performance (req, res) {
  const operatorRepo = new OperatorRepository()
  const results = await operatorRepo.listWithPerformance(req.query)
  res.json(results)
}

async function ownerStats (req, res) {
  const repo = new OwnerRepository()
  const results = await repo.ownerStats(req.query)
  res.json(results)
}

async function worksheetStats (req, res) {
  const repo = new WorksheetRepository()
  const results = await repo.worksheetStats()
  res.json(results)
}

async function ownerBusinessStats (req, res) {
  const repo = new OwnerRepository()
  const results = await repo.ownerBusinessStats()
  res.json(results)
}

export const overAllController = wrap(overAll)
export const performanceController = wrap(performance)
export const ownerStatsController = wrap(ownerStats)
export const worksheetStatsController = wrap(worksheetStats)
export const ownerBusinessStatsController = wrap(ownerBusinessStats)
export const overProvincesController = wrap(overProvinces)

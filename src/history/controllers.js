import { wrap } from 'express-promise-wrap'
import { HistoryRepository } from './models'

async function listHistory (req, res) {
  const repo = new HistoryRepository()
  const historyList = await repo.list(req.query)

  res.json(historyList)
}

export const listHistoryController = wrap(listHistory)

import _ from 'lodash'
import { wrap } from 'express-promise-wrap'
import { OperatorRepository } from '../models'

async function getOperatorRestringedHours (req, res) {
  const repo = new OperatorRepository()
  const operatorId = req.user.operator.id
  const restringedHours = await repo.operatorRestringedHours(operatorId)
  res.json({ restringedHours })
}

async function writeOperatorRestringedHours (req, res) {
  const repo = new OperatorRepository()
  const operatorId = req.user.operator.id
  const restringedHours = _.get(req, 'body.restringedHours', {})
  await repo.writeOperatorRestringedHours(operatorId, restringedHours)
  res.status(204).send()
}

async function writeAnotherOperatorRestringedHours (req, res) {
  const repo = new OperatorRepository()
  const operatorId = req.params.id
  const restringedHours = _.get(req, 'body.restringedHours', {})
  await repo.writeOperatorRestringedHours(operatorId, restringedHours)
  res.status(204).send()
}

export const getOperatorRestringedHoursController = wrap(getOperatorRestringedHours)
export const writeOperatorRestringedHoursController = wrap(writeOperatorRestringedHours)
export const writeAnotherOperatorRestringedHoursController = wrap(writeAnotherOperatorRestringedHours)

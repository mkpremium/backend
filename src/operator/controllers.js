import { wrap } from 'express-promise-wrap'
import { OperatorRefreshTokenRepository, OperatorRepository } from './models'
import { History } from '../history/models'
import { canManageOperator } from '../lib/role-operators'
import { Calls } from '../calls/models'
import { WorksheetQueueRepository } from '../worksheet/models/queue'
import _get from 'lodash/get'

async function login (req, res) {
  const repo = new OperatorRepository()
  const operator = await repo.findByCredential(req.body)
  const response = await repo.createAuthenticatedResponse(operator)

  res.json(response)
}

async function refreshToken (req, res) {
  const repo = new OperatorRepository()
  const refreshToken = await OperatorRefreshTokenRepository.decodeToken(req)
  const operator = await repo.findByIdOrThrow(refreshToken.operatorId)
  const response = await repo.createAuthenticatedResponse(operator)
  await OperatorRefreshTokenRepository.consume(refreshToken.id)
  res.json(response)
}

async function createOperator (req, res) {
  const repo = new OperatorRepository()

  canManageOperator(req.user.operator, req.body)

  const operator = await repo.createOperator(req.body)
  await History.registerCreate({
    contextModel: operator,
    user: req.user
  })
  res.status(201)
  res.json(operator)
}

async function updateOperator (req, res) {
  const repo = new OperatorRepository()
  const operatorId = req.params.id
  const operator = await repo.findByIdOrThrow(operatorId)

  canManageOperator(req.user.operator, operator)

  await repo.updateOperator(operator, req.body)
  res.status(204).send()
}

async function listOperator (req, res) {
  const repo = new OperatorRepository()
  const operators = await repo.list(req.query)
  await History.registerList({
    contextModel: 'operator',
    user: req.user
  })
  res.json(operators)
}

async function limitedListOperator (req, res) {
  const repo = new OperatorRepository()
  const operators = await repo.listView(req.query)
  res.json(operators)
}

async function selfCallCenterWorkInProgress (req, res) {
  const queueId = _get(req, 'user.operator.profile.queueId', null)
  const operatorId = _get(req, 'user.operator.id', null)

  const repoWorksheetQueue = new WorksheetQueueRepository()
  const queueItem = await repoWorksheetQueue.findItemByOperator(queueId, operatorId)

  const model = new Calls()
  const activeCall = await model.findActiveCallByOperatorId(req.user.id)
  res.json(Object.assign({}, req.user.operator, { activeCall, queueItem }))
}

export const loginController = wrap(login)
export const createOperatorController = wrap(createOperator)
export const listOperatorController = wrap(listOperator)
export const limitedListOperatorController = wrap(limitedListOperator)
export const selfCallCenterWorkInProgressController = wrap(selfCallCenterWorkInProgress)
export const refreshTokenController = wrap(refreshToken)
export const updateOperatorController = wrap(updateOperator)

import { wrap } from 'express-promise-wrap'
import { OperatorRepository } from './models'
import { History } from '../history/models'
import { canManageOperator } from '../lib/role-operators'
import { LegacyWorksheetQueueRepository } from '../worksheet/models/queue-repository'
import _get from 'lodash/get'
import { OperatorRefreshTokenRepository } from './operatorRefreshTokenRepository'
import { AddOperatorService } from '../user/service/add-operator.service'

export function createLoginController ({loginService}) {
  return async function (req, res) {
    const response = await loginService.login(req.body)

    res.json(response)
  }
}

async function refreshToken (req, res) {
  const repo = new OperatorRepository()
  const refreshToken = await OperatorRefreshTokenRepository.decodeToken(req)
  const operator = await repo.findByIdOrThrow(refreshToken.operatorId)
  const response = await repo.createAuthenticatedResponse(operator)
  await OperatorRefreshTokenRepository.consume(refreshToken.id)
  res.json(response)
}

export function createAddOperatorController (addOperatorService: AddOperatorService) {
  return async function createOperator (req, res) {
    canManageOperator(req.user.operator, req.body)

    const operator = await addOperatorService.addOperator(req.body, req.user)

    res.status(201)
    res.json(operator)
  }
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

export const listOperatorController = wrap(listOperator)
export const limitedListOperatorController = wrap(limitedListOperator)
export const refreshTokenController = wrap(refreshToken)
export const updateOperatorController = wrap(updateOperator)

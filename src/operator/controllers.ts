import type { OperatorRepository } from './models'
import { canManageOperator } from '../lib/role-operators'
import type { AddOperatorService } from '../user/service/add-operator.service'

export function createLoginController ({ loginService }) {
  return async function (req, res) {
    const response = await loginService.login(req.body)

    res.json(response)
  }
}

export function createAddOperatorController (addOperatorService: AddOperatorService) {
  return async function createOperator (req, res) {
    canManageOperator(req.user.operator, req.body)

    const operator = await addOperatorService.addOperator(req.body, req.user)

    res.status(201)
    res.json(operator)
  }
}

export function updateOperatorControllerFactory ({ operatorRepository }: {operatorRepository: OperatorRepository}) {
  return async function updateOperatorController (req, res) {
    const operatorId = req.params.id
    const operator = await operatorRepository.findByIdOrThrow(operatorId)

    canManageOperator(req.user.operator, operator)

    await operatorRepository.updateOperator(operator, req.body)
    res.status(204).send()
  }
}

export function listOperatorControllerFactory ({ operatorRepository }: {operatorRepository: OperatorRepository}) {
  return async function listOperatorController (req, res) {
    const operators = await operatorRepository.list(req.query)
    res.json(operators)
  }
}

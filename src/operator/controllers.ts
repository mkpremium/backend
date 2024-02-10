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

export function updateOperatorControllerFactory () {
  return async function updateOperatorController (req, res) {
    res.status(501).send()
  }
}

export function listOperatorControllerFactory () {
  return async function listOperatorController (req, res) {
    res.status(501).send()
  }
}

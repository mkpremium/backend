import _get from 'lodash/get'
import _intersection from 'lodash/intersection'
import { OperatorRoles } from '../types/operator'
import { newHttpError } from './http-error'

export function isStreetAdmin (roles) {
  const { STREET_ADMIN } = OperatorRoles
  return _intersection(roles, [STREET_ADMIN]).length === 1
}

export function canManageStreet (roles) {
  const { STREET_MANAGER, STREET_ADMIN } = OperatorRoles
  return _intersection(roles, [STREET_MANAGER, STREET_ADMIN]).length === 1
}

export function nonAdminStreet (roles) {
  const { STREET_MANAGER, STREET } = OperatorRoles
  return _intersection(roles, [STREET_MANAGER, STREET]).length === 1
}

export function isOnlyStreet (roles) {
  const { STREET } = OperatorRoles
  return _intersection(roles, [STREET]).length === 1
}

export function isAdmin (roles) {
  const { ADMIN } = OperatorRoles
  return _intersection(roles, [ADMIN]).length === 1
}

export function isBusiness (roles) {
  const { BUSINESS } = OperatorRoles
  return _intersection(roles, [BUSINESS]).length === 1
}

export function isManager (roles) {
  const { MANAGER, ADMIN } = OperatorRoles
  return _intersection(roles, [MANAGER, ADMIN]).length === 1
}

export function isOperator (roles) {
  const { OPERATOR } = OperatorRoles
  return _intersection(roles, [OPERATOR]).length === 1
}

export function allowManageOperator (manager, operator) {
  if (isAdmin(manager.roles)) {
    return true
  }

  if (canManageStreet(manager.roles) && isOnlyStreet(operator.roles)) {
    return true
  }

  if (isStreetAdmin(manager.roles) && nonAdminStreet(operator.roles)) {
    return true
  }

  if (isManager(manager.roles) && isOperator(operator.roles)) {
    return true
  }

  return false
}

export function canManageOperator (manager, operator) {
  if (!allowManageOperator(manager, operator)) {
    throw newHttpError(403, 'No tiene los permisos suficientes para esta operación')
  }
}

export function canOperatorHandleQueue (operator, queueId) {
  if (isManager(operator.roles)) {
    return true
  }

  const canHandlerQueue = _get(operator, 'profile.queueId') === queueId

  if (!canHandlerQueue) {
    throw newHttpError(403, 'No parece que tenga asociada esta cola en su perfil. Solicite al administrador que lo asigne')
  }

  return true
}

export function canScheduleCall (operator, operatorId) {
  if (isManager(operator.roles)) {
    return true
  }

  if (!isOperator(operator.roles) || operator.id !== operatorId) {
    throw newHttpError(403, 'No tiene los permisos suficientes para esta operación')
  }

  return true
}

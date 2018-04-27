import {OperatorRoles} from '../types/operator';
import _intersection from 'lodash/intersection';
import {newHttpError} from './http-error';

export function isStreet(roles) {
  const {STREET, STREET_MANAGER, STREET_ADMIN} = OperatorRoles;
  return _intersection(roles, [STREET, STREET_MANAGER, STREET_ADMIN]).length > 0;
}

export function isStreetAdmin(roles) {
  const {STREET_ADMIN} = OperatorRoles;
  return _intersection(roles, [STREET_ADMIN]).length === 1;
}

export function isStreetManager(roles) {
  const {STREET_MANAGER} = OperatorRoles;
  return _intersection(roles, [STREET_MANAGER]).length === 1;
}

export function isOnlyStreet(roles) {
  const {STREET} = OperatorRoles;
  return _intersection(roles, [STREET]).length === 1;
}

export function isAdmin(roles) {
  const {ADMIN} = OperatorRoles;
  return _intersection(roles, [ADMIN]).length === 1;
}

export function isBusiness(roles) {
  const {BUSINESS} = OperatorRoles;
  return _intersection(roles, [BUSINESS]).length === 1;
}

export function allowToStreetManagerChangeStreet(manager, operator) {
  if (isStreetManager(manager.roles) && isOnlyStreet(operator.roles)) {
    return true;
  }

  throw newHttpError(403, 'Esta Operación no esta permitida');
}

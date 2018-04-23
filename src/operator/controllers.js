import t from 'tcomb';
import {wrap} from 'express-promise-wrap';
import {OperatorRepository} from './models';
import {History} from '../history/models';
import {firebaseSetup} from '../firebase';

async function login(req, res) {
  const repo = new OperatorRepository();
  const operator = await repo.findByCredential(req.body);
  const response = await createAuthenticatedResponse(operator);

  res.json(response);
}

async function refreshToken(req, res) {
  const repo = new OperatorRepository();
  const payload = await OperatorRepository.decodeToken(req);
  const operator = await repo.findByIdOrThrow(payload.id);
  const response = await createAuthenticatedResponse(operator);
  res.json(response);
}

async function createAuthenticatedResponse(operator) {
  const tokenPayload = {
    id: operator.id,
    permissions: operator.roles,
    operator: {
      id: operator.id,
      name: operator.profile.fullName(),
      username: operator.username,
      city: operator.profile.city
    }
  };

  const token = await OperatorRepository.createToken(tokenPayload);
  const firebase = await firebaseSetup(operator);

  return t.AuthenticatedResponse({
    token,
    roles: operator.roles,
    operator: tokenPayload.operator,
    firebase
  });
}

async function createOperator(req, res) {
  const repo = new OperatorRepository();
  const operator = await repo.save(req.body);
  await History.registerCreate({
    contextModel: operator,
    user: req.user
  });
  res.status(201);
  res.json(operator);
}

async function listOperator(req, res) {
  const repo = new OperatorRepository();
  const operators = await repo.list(req.query);
  await History.registerList({
    contextModel: 'operator',
    user: req.user
  });
  res.json(operators);
}

async function limitedListOperator(req, res) {
  const repo = new OperatorRepository();
  const operators = await repo.listView(req.query);
  res.json(operators);
}

async function me(req, res) {
  res.json(req.user.operator);
}

export const loginController = wrap(login);
export const createOperatorController = wrap(createOperator);
export const listOperatorController = wrap(listOperator);
export const limitedListOperatorController = wrap(limitedListOperator);
export const meController = wrap(me);
export const refreshTokenController = wrap(refreshToken);

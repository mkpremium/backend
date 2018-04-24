import {wrap} from 'express-promise-wrap';
import {OperatorRefreshTokenRepository, OperatorRepository} from './models';
import {History} from '../history/models';

async function login(req, res) {
  const repo = new OperatorRepository();
  const operator = await repo.findByCredential(req.body);
  const response = await repo.createAuthenticatedResponse(operator);

  res.json(response);
}

async function refreshToken(req, res) {
  const repo = new OperatorRepository();
  const refreshToken = await OperatorRefreshTokenRepository.decodeToken(req);
  const operator = await repo.findByIdOrThrow(refreshToken.operatorId);
  const response = await repo.createAuthenticatedResponse(operator);
  await OperatorRefreshTokenRepository.consume(refreshToken.id);
  res.json(response);
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

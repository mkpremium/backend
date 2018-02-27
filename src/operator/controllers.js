import t from 'tcomb';
import {wrap} from 'express-promise-wrap';
import {OperatorRepository} from './models';

async function login(req, res) {
  const repo = new OperatorRepository();
  const operator = await repo.findByCredential(req.body);
  const tokenPayload = {
    id: operator.id,
    permissions: operator.roles,
    operator: {
      id: operator.id,
      name: operator.profile.fullName(),
      username: operator.username
    }
  };

  const token = await OperatorRepository.createToken(tokenPayload);

  res.json(t.AuthenticatedResponse({
    token,
    roles: operator.roles,
    operator: tokenPayload.operator
  }));
}

async function createOperator(req, res) {
  const repo = new OperatorRepository();
  const result = await repo.save(req.body);
  res.status(201);
  res.json(result);
}

async function listOperator(req, res) {
  const repo = new OperatorRepository();
  const operators = await repo.list(req.query);
  res.json(operators);
}

async function me(req, res) {
  res.json(req.user.operator);
}

export const loginController = wrap(login);
export const createOperatorController = wrap(createOperator);
export const listOperatorController = wrap(listOperator);
export const meController = wrap(me);

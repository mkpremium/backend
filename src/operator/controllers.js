import t from 'tcomb';
import {wrap} from 'express-promise-wrap';
import {OperatorRepository} from './models';

async function login(req, res) {
  const repo = new OperatorRepository();
  const operator = await repo.findByCredential(req.body);
  const token = await repo.createToken(operator);

  res.json(t.AuthenticatedResponse({
    token,
    roles: operator.roles,
    operator: {
      id: operator.id,
      name: operator.profile.fullName(),
      username: operator.username
    }
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

export const loginController = wrap(login);
export const createOperatorController = wrap(createOperator);
export const listOperatorController = wrap(listOperator);

import {wrap} from 'express-promise-wrap';
import {Operator, OperatorRepository} from './models';

async function login(req, res) {
  const repo = new OperatorRepository();
  const operator = await repo.findByCredential(req.body);
  const token = await repo.createToken(operator);

  res.json({
    token,
    operator: operator
  });
}

async function createOperator(req, res) {
  const model = new Operator();
  const result = await model.save(req.body);
  res.status(201);
  res.json(result);
}

export const loginController = wrap(login);
export const createOperatorController = wrap(createOperator);

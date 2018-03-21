import t from 'tcomb';
import {wrap} from 'express-promise-wrap';
import {OperatorRepository} from './models';
import {History} from '../history/models';
import firebaseAdmin from '../firebase';
import {firebase} from '../../config';

async function login(req, res) {
  const repo = new OperatorRepository();
  const operator = await repo.findByCredential(req.body);
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
  const firebaseToken = await firebaseAdmin.auth().createCustomToken(operator.id);

  res.json(t.AuthenticatedResponse({
    token,
    roles: operator.roles,
    operator: tokenPayload.operator,
    firebase: {
      token: firebaseToken,
      databaseURL: firebase.databaseURL
    }
  }));
}

async function createOperator(req, res) {
  const repo = new OperatorRepository();
  const result = await repo.save(req.body);
  await History.registerCreate({
    contextModel: result,
    user: req.user
  });
  res.status(201);
  res.json(result);
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

async function me(req, res) {
  res.json(req.user.operator);
}

export const loginController = wrap(login);
export const createOperatorController = wrap(createOperator);
export const listOperatorController = wrap(listOperator);
export const meController = wrap(me);

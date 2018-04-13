import t from 'tcomb';
import {wrap} from 'express-promise-wrap';
import {compose} from 'compose-middleware';
import {OperatorRepository} from './models';
import {History} from '../history/models';
import {firebaseSetup} from '../firebase';

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
  const firebase = await firebaseSetup(operator);

  res.json(t.AuthenticatedResponse({
    token,
    roles: operator.roles,
    operator: tokenPayload.operator,
    firebase
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

async function limitedListOperator(req, res) {
  const repo = new OperatorRepository();
  const operators = await repo.listView(req.query);
  res.json(operators);
}

async function me(req, res) {
  res.json(req.user.operator);
}

async function updateNeighborhood(req, res, next) {
  const repo = new OperatorRepository();
  const params = t.ChangeUserNeighborhoodBody(req.body);
  const operator = await repo.findByIdOrThrow(params.userId);
  const updatedOperator = await repo.updateProfile(operator, params.toParams());
  req.message = `Set user to new neighborhood ${updatedOperator.profile.neighborhood}`;
  next();
}

async function updateOperatorState(req, res, next) {
  const repo = new OperatorRepository();
  const params = t.ChangeUserStateBody(req.body);
  const operator = await repo.findByIdOrThrow(params.userId);
  const updatedOperator = await repo.update(operator, params.toParams());
  req.message = `Usuario ${updatedOperator.id} ${updatedOperator.profile.getStateMessage()} `;
  next();
}

function oldAppResponse(req, res) {
  res.json({
    Error: false,
    Message: req.message
  });
}

export const loginController = wrap(login);
export const createOperatorController = wrap(createOperator);
export const listOperatorController = wrap(listOperator);
export const limitedListOperatorController = wrap(limitedListOperator);
export const meController = wrap(me);

export const updateNeighborhoodController = compose([wrap(updateNeighborhood), oldAppResponse]);
export const updateOperatorStateController = compose([wrap(updateOperatorState), oldAppResponse]);

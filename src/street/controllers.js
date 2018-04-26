import t from 'tcomb';
import {compose} from 'compose-middleware';
import {wrap} from 'express-promise-wrap';
import {NeighborhoodRepository} from './models';
import {BuildingRepository} from '../building/models';
import {OperatorRepository} from '../operator/models';
import {fbInformadores} from '../firebase';
import {allowToStreetManagerChangeStreet} from '../lib/role-operators';

async function updateOperatorState(req, res, next) {
  const repo = new OperatorRepository();
  const params = t.ChangeUserStateBody(req.body);
  const operator = await repo.findByIdOrThrow(params.userId);
  allowToStreetManagerChangeStreet(req.user.operator, operator);
  const updatedOperator = await repo.update(operator, params.toParams());
  res.message = `Usuario ${updatedOperator.id} ${updatedOperator.profile.getStateMessage()}`;
  next();
}

async function updateNeighborhood(req, res, next) {
  const repo = new OperatorRepository();
  const params = t.ChangeUserNeighborhoodBody(req.body);
  const operator = await repo.findByIdOrThrow(params.userId);
  const updatedOperator = await repo.updateProfile(operator, params.toParams());
  res.message = `Set user to new neighborhood ${updatedOperator.profile.neighborhood}`;
  next();
}

async function getNeighborhoodCenter(req, res, next) {
  const repo = new NeighborhoodRepository();
  const params = t.QueryNeighborhoodCenter(req.body);
  const results = await repo.listFiltered(params.Ciudad, params.Barrio);
  res.message = JSON.stringify(results);
  next();
}

async function getBuildingsLocation(req, res, next) {
  const repo = new BuildingRepository();
  const params = t.QueryBuildingsLocation(req.body);
  res.message = await repo.findWrongStateBuildingsByCity(params.city);
  next();
}

async function getCityInfo(req, res, next) {
  const repo = new BuildingRepository();
  const params = t.QueryBuildingsLocation(req.body);
  res.message = await repo.findWrongStateBuildingsStatsByCity(params.city);
  next();
}

async function oldLogin(req, res, next) {
  const repo = new OperatorRepository();
  const params = t.QueryLoginCredentials(req.body);
  const operator = await repo.findByCredential(params.toParams());
  const response = await repo.createAuthenticatedResponse(operator);
  res.message = `Usuario ${operator.username} activo`;
  res.token = response.token;
  next();
}

async function getLocationsAtDay(req, res, next) {
  const db = fbInformadores.database();
  const params = t.QueryLocationsAtDay(req.body);
  const snapshot = await db.ref(`Locations/${params.date}`).once('value');
  res.message = snapshot.val();
  next();
}

function oldAppResponse(req, res) {
  res.json({
    Error: false,
    Message: res.message
  });
}

function oldLoginResponse(req, res) {
  res.json({
    Error: false,
    Message: res.message,
    Token: res.token
  });
}

export const updateNeighborhoodController = compose([wrap(updateNeighborhood), oldAppResponse]);
export const updateOperatorStateController = compose([wrap(updateOperatorState), oldAppResponse]);
export const getNeighborhoodCenterController = compose([wrap(getNeighborhoodCenter), oldAppResponse]);
export const getBuildingsLocationController = compose([wrap(getBuildingsLocation), oldAppResponse]);
export const getCityInfoController = compose([wrap(getCityInfo), oldAppResponse]);
export const oldLoginController = compose([wrap(oldLogin), oldLoginResponse]);
export const getLocationsAtDayController = compose([wrap(getLocationsAtDay), oldAppResponse]);

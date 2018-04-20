import t from 'tcomb';
import {compose} from 'compose-middleware';
import {wrap} from 'express-promise-wrap';
import {NeighborhoodRepository} from './models';
import {BuildingRepository} from '../building/models';
import {OperatorRepository} from '../operator/models';

async function updateOperatorState(req, res, next) {
  const repo = new OperatorRepository();
  const params = t.ChangeUserStateBody(req.body);
  const operator = await repo.findByIdOrThrow(params.userId);
  const updatedOperator = await repo.update(operator, params.toParams());
  req.message = `Usuario ${updatedOperator.id} ${updatedOperator.profile.getStateMessage()} `;
  next();
}

async function updateNeighborhood(req, res, next) {
  const repo = new OperatorRepository();
  const params = t.ChangeUserNeighborhoodBody(req.body);
  const operator = await repo.findByIdOrThrow(params.userId);
  const updatedOperator = await repo.updateProfile(operator, params.toParams());
  req.message = `Set user to new neighborhood ${updatedOperator.profile.neighborhood}`;
  next();
}

async function getNeighborhoodCenter(req, res, next) {
  const repo = new NeighborhoodRepository();
  const params = t.QueryNeighborhoodCenter(req.body);
  const results = await repo.listFiltered(params.Ciudad, params.Barrio);
  req.message = JSON.stringify(results);
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

function oldAppResponse(req, res) {
  res.json({
    Error: false,
    Message: res.message
  });
}

export const updateNeighborhoodController = compose([wrap(updateNeighborhood), oldAppResponse]);
export const updateOperatorStateController = compose([wrap(updateOperatorState), oldAppResponse]);
export const getNeighborhoodCenterController = compose([wrap(getNeighborhoodCenter), oldAppResponse]);
export const getBuildingsLocationController = compose([wrap(getBuildingsLocation), oldAppResponse]);
export const getCityInfoController = compose([wrap(getCityInfo), oldAppResponse]);

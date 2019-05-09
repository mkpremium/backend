import {wrap} from 'express-promise-wrap';
import {CadastreRepository} from './models';
import {CitiesInput, StreetsInput} from './types';

async function getProvinces(req, res) {
  const repo = new CadastreRepository();
  const provinces = await repo.getProvinces();
  res.json(provinces);
}

async function getCities(req, res) {
  CitiesInput(req.query || {});
  const repo = new CadastreRepository();
  const {province} = req.query;
  const cities = await repo.getCitiesByProvince(province);
  res.json(cities);
}

async function getStreets(req, res) {
  StreetsInput(req.query || {});
  const repo = new CadastreRepository();
  const {province, city} = req.query;
  const streets = await repo.getStreetNamesByCity(province, city);
  res.json(streets);
}

async function getCompleteInfo(req, res) {
  const repo = new CadastreRepository();
  const completeInfo = await repo.getCompleteInfo(req.body || {});
  res.json(completeInfo);
}

export const getProvincesController = wrap(getProvinces);
export const getCitiesController = wrap(getCities);
export const getStreetsController = wrap(getStreets);
export const getCompleteInfoController = wrap(getCompleteInfo);

import {wrap} from 'express-promise-wrap';
import {createBuildingWithWorksheet} from './model';

async function createBuilding(req, res) {
  const worksheet = await createBuildingWithWorksheet(req.body);
  res.status(201).json(worksheet);
}

export const createBuildingController = wrap(createBuilding);

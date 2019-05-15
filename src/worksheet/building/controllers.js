import {wrap} from 'express-promise-wrap';
import {createBuildingWithWorksheet} from './model';

async function createBuilding(req, res) {
  const {worksheet, created} = await createBuildingWithWorksheet(req.body);
  if (created) {
    res.status(201).json(worksheet);
  } else {
    res.status(400).json({
      message: 'Ya Existe un edificio con el mismo cadastre.reference',
      worksheet
    });
  }
}

export const createBuildingController = wrap(createBuilding);

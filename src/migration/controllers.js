import {wrap} from 'express-promise-wrap';

async function list(req, res) {
  const things = await req.app.locals.bucket.getList('United States');
  res.json({things});
}
async function importBuilding(req, res) {
  res.json();
}

export const listController = wrap(list);
export const importBuildingController = wrap(importBuilding);

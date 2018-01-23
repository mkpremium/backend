import {Router} from 'express';
import {createBulkImportController, createImportController, createListController} from './controllers';

const router = Router();

const pathModels = {
  buildings: 'building',
  operators: 'operator',
  owners: 'owner',
  people: 'person',
  housestates: 'housestate',
  worksheets: 'worksheet',
  history: 'history'
};

Object.keys(pathModels).forEach(routePath => {
  const modelName = pathModels[routePath];
  router.get(`/${routePath}`, createListController(modelName));
  router.get(`/${routePath}/bulkimport`, createBulkImportController(modelName));
  router.post(`/${routePath}`, createImportController(modelName));
});

export default router;

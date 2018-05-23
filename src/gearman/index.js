import gearman from 'gearmanode';
import {gearmanConfig} from '../../config';

export default (app) => {
  app.locals.gearman = gearman.client(gearmanConfig);
};

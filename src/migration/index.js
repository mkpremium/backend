import fileUpload from 'express-fileupload';
import gearman from 'gearmanode';
import debug from 'debug';
import routes from './routes';
import {gearmanConfig, migrationEnabled} from '../../config';

const debugMigration = debug('app:migration');

export default (app) => {
  debugMigration('enabled', migrationEnabled);
  if (!migrationEnabled) {
    return;
  }
  const files = fileUpload({
    safeFileNames: true
  });

  app.locals.gearman = gearman.client(gearmanConfig);
  app.set('view engine', 'ejs');
  app.set('tmpdir', '/tmp');
  app.use('/migration', files, routes);
};

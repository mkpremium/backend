import fileUpload from 'express-fileupload';
import debug from 'debug';
import routes from './routes';
import {migrationEnabled} from '../../config';

const debugMigration = debug('app:migration');

export default (app) => {
  debugMigration('enabled', migrationEnabled);
  if (!migrationEnabled) {
    return;
  }
  const files = fileUpload({
    safeFileNames: true
  });
  app.set('view engine', 'ejs');
  app.set('tmpdir', '/tmp');
  app.use('/migration', files, routes);
};

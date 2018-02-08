import morganBody from 'morgan-body';
import routes from './routes';

import './types';

export default () => (app) => {
  morganBody(app);

  app.use('/webhooks/numintec', routes.webhookRouter);
  app.use('/calls', routes.apiRouter);
};

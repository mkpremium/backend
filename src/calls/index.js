import morganBody from 'morgan-body';
import routes from './routes';

import './types';

export default () => (app) => {
  morganBody(routes.webhookRouter);

  app.use('/webhooks/numintec', routes.webhookRouter);
  app.use('/calls', routes.apiRouter);
};

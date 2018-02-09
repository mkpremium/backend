import routes from './routes';

import './types';

export default (app) => {
  app.use('/calls', routes);
};

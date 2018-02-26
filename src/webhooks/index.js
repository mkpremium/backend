import {webhookCallsRouter} from '../calls/routes';
import morganBody from 'morgan-body';

export default (app) => {
  morganBody(app, {
    skip: (req, res) => {
      return !req.originalUrl.includes('/webhook');
    }
  });
  app.use('/webhook/calls', webhookCallsRouter);
};

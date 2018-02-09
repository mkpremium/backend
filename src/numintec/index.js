import morganBody from 'morgan-body';
import {Router} from 'express';

function loggerWebhook(req, res) {
  res.status(204).send();
}

export default () => (req, res, next) => {
  const router = Router();

  morganBody(req.app);

  router.post('/', loggerWebhook);
  router.put('/', loggerWebhook);
  router.get('/', loggerWebhook);
  router.options('/', loggerWebhook);
  router.patch('/', loggerWebhook);
  req.app.use('/webhooks/numintec', router);
  next();
};

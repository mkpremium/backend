import routes from './routes';

export default () => (req, res, next) => {
  req.app.use('/migration', routes);
  next();
};

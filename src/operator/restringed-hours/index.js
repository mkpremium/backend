import routes from './routes';

export default (app) => {
  app.use('/restringed-hours', routes);
};

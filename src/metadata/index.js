import routes from './routes'

export default (app, secured) => {
  app.use('/metadata', secured, routes)
}

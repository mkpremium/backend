import routes from './routes'

export function statRoutes (app, secured) {
  app.use('/stats', secured, routes)
}

import { createPropertyManagerRouter } from './routes'

export const init = (app, container, secured) => {
  app.use('/property-manager', secured, createPropertyManagerRouter(container.resolve('stockRepository')))
}

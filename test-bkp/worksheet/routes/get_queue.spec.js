import request from 'supertest'
import app from '../../../src/app'
import { WorksheetQueueRepository } from '../../../src/worksheet/models/queue'
import { deleteAll, operatorCreate, operatorCreateAdmin, operatorCreateManager, operatorLogin } from '../../../test/common'

describe('worksheet.routes', () => {
  let authenticatedOperator
  let authenticatedAdmin
  let queue
  before(async () => {
    await deleteAll()
    const repo = new WorksheetQueueRepository()
    queue = await repo.save({
      name: 'barcelona'
    })

    await operatorCreateManager()
    await operatorCreateAdmin()
    await operatorCreate('', queue.id)
    authenticatedOperator = await operatorLogin(app, { username: 'operator', password: 'Passw0rd' })
    authenticatedAdmin = await operatorLogin(app, { username: 'admin', password: 'Passw0rd' })
  })
  describe('queue.routes', () => {
    describe('GET /worksheets/queues/:id @request', () => {
      it('200 Devuelve cola de fichas de trabajo', async () => {
        return request(app)
          .get(`/worksheets/queues/${queue.id}`)
          .set('Authorization', authenticatedOperator.authorization)
          .expect(200)
      })

      it('404 Ciudad no encontrada', async () => {
        return request(app)
          .get('/worksheets/queues/barranquilla')
          .set('Authorization', authenticatedOperator.authorization)
          .expect(404)
      })
    })
    describe('GET /worksheets/queues @request', () => {
      it('200 Lista las colas', async () => {
        return request(app)
          .get('/worksheets/queues')
          .set('Authorization', authenticatedAdmin.authorization)
          .expect(200)
      })
    })
  })
})

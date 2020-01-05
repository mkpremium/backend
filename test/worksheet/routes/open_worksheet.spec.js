import Promise from 'bluebird'
import request from 'supertest'
import times from 'lodash/times'
import app from '../../../src/app'

import { WorksheetRepository } from '../../../src/worksheet/models/worksheet'
import { WorksheetQueueRepository } from '../../../src/worksheet/models/queue'
import { deleteAll, operatorCreate, operatorLogin } from '../../common'

describe('worksheet.routes', () => {
  let queueItems = []
  let authenticatedOperator
  let queue
  before(async () => {
    const worksheetRepo = new WorksheetRepository()
    const worksheetQueueRepo = new WorksheetQueueRepository()

    await deleteAll()

    queue = await worksheetQueueRepo.save({ name: 'madrid' })
    const worksheets = await Promise.all(times(5, () => worksheetRepo.save({})))

    await Promise
      .mapSeries(worksheets, (worksheet) => worksheetQueueRepo.addWorksheetAndSave(queue.id, worksheet.id))

    queue = await worksheetQueueRepo.findByIdOrThrow(queue.id)
    queueItems = queue.worksheets

    await operatorCreate('', queue.id)
    authenticatedOperator = await operatorLogin(app, { username: 'operator', password: 'Passw0rd' })
  })

  describe('queue.routes', () => {
    describe('POST /worksheets/queues/:id @request', () => {
      it('200 Toma el item de la cola', async () => {
        await request(app)
          .post(`/worksheets/queues/${queue.id}`)
          .set('Authorization', authenticatedOperator.authorization)
          .send({ queueItemId: queueItems[0].id })
          .expect(200)

        const response = await request(app)
          .get(`/worksheets/queues/${queue.id}`)
          .set('Authorization', authenticatedOperator.authorization)
          .expect(200)
        const openedWorksheets = response.body.worksheets.filter(w => w.status === 'OPENED')
        openedWorksheets.should.have.length(1)
        const [openedWorksheet] = openedWorksheets
        openedWorksheet.should.have.a.property('operatorId')
        openedWorksheet.operatorId.should.be.equal(authenticatedOperator.operator.id)
      })

      it('200 Una hoja puede ser obtenida despues de abierta', async () => {
        await request(app)
          .get(`/worksheets/${queueItems[0].worksheetId}`)
          .set('Authorization', authenticatedOperator.authorization)
          .expect(200)
      })

      it('404 Cola no encontrada', async () => {
        return request(app)
          .post('/worksheets/queues/barranquilla')
          .set('Authorization', authenticatedOperator.authorization)
          .send({ queueItemId: queueItems[0].id })
          .expect(404)
      })

      it('400 El item no existe en la cola', async () => {
        return request(app)
          .post(`/worksheets/queues/${queue.id}`)
          .set('Authorization', authenticatedOperator.authorization)
          .send({ queueItemId: 'no-existe' })
          .expect(400)
      })

      it.skip('409 El item no esta disponible para ser tomado', async () => {
        return request(app)
          .post(`/worksheets/queues/${queue.id}`)
          .set('Authorization', authenticatedOperator.authorization)
          .send({ queueItemId: queueItems[0].id })
          .expect(409)
      })

      it.skip('204 Libera un item abierto', async () => {
        return request(app)
          .post(`/worksheets/queues/${queue.id}`)
          .set('Authorization', authenticatedOperator.authorization)
          .send({
            queueItemId: queueItems[0].id,
            action: 'RELEASE'
          })
          .expect(204)
      })

      it('200 Despues de liberarse puede tomarse de nuevo el item', async () => {
        const response = await request(app)
          .post(`/worksheets/queues/${queue.id}`)
          .set('Authorization', authenticatedOperator.authorization)
          .send({
            queueItemId: queueItems[0].id,
            action: 'TAKE'
          })
          .expect(200)
        response.body.should.be.a('object')
        response.body.should.have.a.property('relatedOwners')
        response.body.relatedOwners.should.be.a('array')
      })

      it('409 No puede tomar mas de un item', async () => {
        return request(app)
          .post(`/worksheets/queues/${queue.id}`)
          .set('Authorization', authenticatedOperator.authorization)
          .send({
            queueItemId: queueItems[1].id,
            action: 'TAKE'
          })
          .expect(409)
      })

      it('200 Toma el siguiente item', async () => {
        const response = await request(app)
          .post(`/worksheets/queues/${queue.id}`)
          .set('Authorization', authenticatedOperator.authorization)
          .send({
            action: 'NEXT'
          })
        response.status.should.equal(200)
      })
    })
  })
})

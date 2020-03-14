import http from 'http'
import express from 'express'
import request from 'supertest'
import { resolve } from 'path'
import app from '../../../src/app'

import socket from '../../../src/socket'
import { OperatorRepository } from '../../../src/operator/models'

import { Calls } from '../../../src/calls/models'
import { MigrateModel } from '../../../src/migration/lib/migrate-model'
import { deleteAll, operatorLogin } from '../../../test/common'

import { tests } from '../../../config'

const port = process.env.SOCKET_PORT || '9002'
let authenticatedOperator

if (!tests.skipCalls) {
  describe('calls.routes', () => {
    let server
    let owner
    let person
    let callObject
    let webhookEventStartCall
    let webhookEventToBeOmitted
    let callsModel
    let contactIdToBeCalled

    before(async () => {
      await app.locals.bucketPromise
      await deleteAll()

      const socketApp = express()
      server = http.Server(socketApp)
      server.listen(port, () => {
        socket.startServer(server)
      })

      const operatorRepo = new OperatorRepository()
      callsModel = new Calls()

      await operatorRepo.save({
        username: 'callerOperator',
        password: 'Passw0rd',
        agentNumber: '10106-919',
        serviceId: '17146',
        roles: [
          'OPERATOR'
        ],
        profile: {
          firstName: 'operator',
          lastName: 'operator'
        }
      })
      authenticatedOperator = await operatorLogin(app, { username: 'callerOperator', password: 'Passw0rd' })
      const migrate = new MigrateModel('owner', resolve(__dirname, '../../fixtures/sample_calls_owner.csv'), app)
      const results = await migrate.run()
      person = results.find(o => o.contacts && o.contacts.length > 0)
      owner = results.find(o => o.personId === person.id)

      contactIdToBeCalled = person.contacts[0].id

      webhookEventStartCall = {
        tag: 'dialog-info',
        data: {
          remoteidentity: '0056949826553',
          localidentity: '10106-919',
          state: 'early',
          fromuser: '0056949826553',
          ServiceData: '0056949826553#17146#9151938902790598604###1',
          called: '10106-919'
        }
      }

      webhookEventToBeOmitted = {
        tag: 'dialog-info',
        data: {
          remoteidentity: '0056949826553',
          localidentity: '10106-919',
          state: 'early',
          fromuser: '934922728',
          ServiceData: '0056949826553#17146#9151938902790598604###1',
          called: '10106-919'
        }
      }

      callObject = {
        userId: authenticatedOperator.operator.id,
        from: '919',
        to: '+56949826553',
        callId: '9151938902790598604'
      }
      await callsModel.save(callObject)
    })

    after((done) => {
      server.close()
      done()
    })

    describe('POST /calls/owner/:ownerId @request', () => {
      it('200 Operación exitosa', async () => {
        await request(app)
          .post(`/calls/owner/${owner.id}`)
          .send({ contactId: contactIdToBeCalled })
          .set('Authorization', authenticatedOperator.authorization)
          .expect(200)
      })
    })

    describe('POST /calls/owner/:ownerId @request', () => {
      const contactId = 'TEST'
      it('400 Operación fallida', async () => {
        await request(app)
          .post(`/calls/owner/${owner.id}`)
          .send({ contactId })
          .set('Authorization', authenticatedOperator.authorization)
          .expect(400)
      })
    })

    describe('POST /calls/hangup @request', () => {
      it('400 Operación fallida', async () => {
        await request(app)
          .post('/calls/hangup')
          .set('Authorization', authenticatedOperator.authorization)
          .expect(400)
      })
    })

    describe('POST /calls/note/:callId @request', () => {
      it('204 Operación exitosa', async () => {
        const callId = callObject.callId
        await request(app)
          .post(`/calls/note/${callId}`)
          .set('Authorization', authenticatedOperator.authorization)
          .send({
            note: 'Test note'
          })
          .expect(204)
        const call = await callsModel.findByCallId(callId)
        call.notes.should.have.length(1)
      })
    })

    describe('POST /webhook/calls @request', () => {
      it('200 Operación exitosa', async () => {
        await request(app)
          .post('/webhook/calls')
          .send(webhookEventStartCall)
          .expect(200)
      })

      it('204 Operación exitosa - evento desconocido registrado en CallsRawEvents', async () => {
        await request(app)
          .post('/webhook/calls')
          .send({ data: 'unknown' })
          .expect(204)
      })

      it('204 Operación exitosa - evento omitido', async () => {
        await request(app)
          .post('/webhook/calls')
          .send(webhookEventToBeOmitted)
          .expect(204)
      })
    })
  })

  describe('calls.model', () => {
    let callsModel
    before(async () => {
      await app.locals.bucketPromise
      await deleteAll()
      const operatorRepo = new OperatorRepository()
      callsModel = new Calls()

      await operatorRepo.save({
        username: 'callerOperator',
        password: 'Passw0rd',
        agentNumber: '10106-919',
        serviceId: '17146',
        roles: [
          'OPERATOR'
        ],
        profile: {
          firstName: 'operator',
          lastName: 'operator'
        }
      })
      authenticatedOperator = await operatorLogin(app, { username: 'callerOperator', password: 'Passw0rd' })
      await callsModel.save({
        userId: authenticatedOperator.operator.id,
        from: '919',
        to: '+56949826553',
        callId: '9151938902790598604',
        events: [],
        status: 'INICIADA'
      })
    })

    describe('Find Call by callId', () => {
      it('should find call register by callId', async () => {
        const callId = '9151938902790598604'
        const foundCall = await callsModel.findByCallId(callId)
        foundCall.callId.should.be.equal(callId)
      })
    })
  })
}

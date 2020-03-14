import request from 'supertest'
import app from '../../src/app'
import { deleteAll, operatorCreate, operatorLogin } from '../../test/common'

describe('JWT middleware', () => {
  let authenticatedOperator
  before(async () => {
    await deleteAll()
    await operatorCreate()
    authenticatedOperator = await operatorLogin(app, { username: 'operator', password: 'Passw0rd' })
  })

  it('Devuelve la información del usuario', async () => {
    const response = await request(app)
      .get('/operators/me')
      .set('Authorization', authenticatedOperator.authorization)
      .expect(200)

    response.body.should.be.a('object')
  })
})

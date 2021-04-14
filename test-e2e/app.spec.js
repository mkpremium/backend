import app from '../src/app'
import request from 'supertest'
import { expect } from 'chai'

describe('Backend Application', () => {
  it('is not ready until all dependencies are resolved', async () => {
    expect(app.get('IS_READY')).to.be.false
    await request(app)
      .get('/_ready')
      .expect(503)

    expect(app.get('IS_READY')).to.be.true
    await request(app)
      .get('/_ready')
      .expect(200)
  })
})

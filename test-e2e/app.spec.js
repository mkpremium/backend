import app from '../src/app'
import request from 'supertest'

describe('Backend Application', () => {
  it('starts unhealthy until it gets connection to Couchbase', async () => {
    await request(app)
      .get('/_health')
      .expect(503)

    await app.locals.bucketPromise

    await request(app)
      .get('/_health')
      .expect(200)
  })
})

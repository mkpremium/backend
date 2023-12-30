const axios = require('axios')

const baseURL = 'http://localhost:9001'

axios.post(`${baseURL}/operators/login`, {
  username: 'admin',
  password: 'admin'
})
  .then(({ data: { token } }) => {
    return axios.create({
      baseURL: `${baseURL}`,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  })
  .then(client => createWorksheetQueue(client)
    .then(
      ({ data: { id: queueId } }) =>
        Promise.all([
          createFlipper(client, queueId)
            .then(({ data: { id: flipperId } }) => createCaller(client, queueId, flipperId)),
          createFlipperCaller(client, queueId),
          createTestBuildings(client, 20).catch(error => {
            console.error('Error creating buildings', { error })
          })
        ])
    ).catch(error => {
      console.error('Error!', { response: error.response })
      process.exit(1)
    })
    .then(() => {
      console.log('Done!')
      process.exit(0)
    })
  )

function createFlipper (client, queueId) {
  return client.post('/operators', {
    username: 'flipper',
    password: 'flipper1',
    roles: [ 'BUSINESS' ],
    profile: {
      firstName: 'Deyvi',
      lastName: 'Flipper',
      email: 'flipper@email.test',
      queueId
    }
  })
}

function createWorksheetQueue (client) {
  return client.post('/worksheets/queues', {
      name: 'test-queue',
      source: {
        province: 'TEST_BARCELONA'
      }
    }
  )
}

function createCaller (client, queueId, flipperId) {
  return client.post('/operators', {
    flipperId,
    username: 'caller',
    password: 'caller10',
    roles: [ 'OPERATOR' ],
    profile: {
      firstName: 'Esther',
      lastName: 'Caller',
      email: 'caller@email.test',
      queueId
    }
  })
}

function createFlipperCaller (client, queueId) {
  return client.post('/operators', {
    username: 'flipper-caller',
    password: 'flipper-caller1',
    roles: [ 'OPERATOR', 'BUSINESS' ],
    profile: {
      firstName: 'Maria',
      lastName: 'Flipper Caller',
      email: 'flipper-caller@email.test',
      queueId
    }
  })
}

async function createTestBuildings (client, n) {
  function * generator () {
    for (let i = 0; i < n; i++) {
      yield i
    }
  }

  for await (let i of generator()) {
    await client.post('/test-harness/create-building')
  }
}

const axios = require('axios')

const baseURL = 'http://localhost:9001'
// TODO create admin user

axios.post(`${baseURL}/operators/login`, {
  username: 'admin',
  password: 'admin'
}).then(({ data: { token } }) => {
  return axios.create({
    baseURL: `${baseURL}`,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
})
  .then(client => createWorksheetQueue(client)
    .then(
      ({ id: queueId }) =>
        Promise.all([
          createFlipper(client, queueId)
            .then(({ id: flipperId }) => createCaller(client, queueId, flipperId)),
          createFlipperCaller(client, queueId),
          createTestBuildings(client  , 100).catch(error => {
            console.error('Error creating buildings', { error })
          })
        ])
    ).catch(error => {
      console.error('Error!', { error })
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
    email: 'flipper@email.test',
    roles: [ 'BUSINESS' ],
    profile: {
      firstName: 'Deyvi',
      lastName: 'Flipper',
      queueId
    }
  })
}

function createWorksheetQueue (client) {
  return client.post('/worksheets/queues', {
      name: 'test-queue',
      source: {
        city: 'TEST_PORTO'
      }
    }
  )
}

function createCaller (client, queueId, flipperId) {
  return client.post('/operators', {
    flipperId,
    username: 'caller',
    password: 'caller10',
    email: 'caller@email.test',
    roles: [ 'OPERATOR' ],
    profile: {
      firstName: 'Esther',
      lastName: 'Caller',
      queueId
    }
  })
}

function createFlipperCaller (client, queueId) {
  return client.post('/operators', {
    username: 'flipper-caller',
    password: 'flipper-caller1',
    email: 'flipper-caller@email.test',
    roles: [ 'OPERATOR', 'BUSINESS' ],
    profile: {
      firstName: 'Maria',
      lastName: 'Flipper Caller',
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
    client.post('/test-harness/create-building')
  }
}

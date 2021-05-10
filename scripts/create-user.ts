import { connectCouchbaseBucket } from '../src/db/connect-couchbase-bucket'
import { createFullOperator } from '../test/common'

const [ username, password, role ] = process.argv.slice(2)
console.log('creating user', { username, password, role })

connectCouchbaseBucket()
  .then(() => createOperator({ username, password, role }))
  .catch(error => {
    console.error('Error creating user', { error })
    process.exit(1)
  }).then(() => process.exit())


async function createOperator({ username, password, role }) {
  await createFullOperator({
    username,
    password,
    agentNumber: randomAgentNumber(),
    serviceId: randomServiceId(),
    roles: [
      role
    ],
    profile: {
      firstName: username,
      lastName: 'Operator'
    }
  })
}

function randomAgentNumber() {
  const first = Math.floor((Math.random() * 10200) + 10300)
  return `${first}-920`
}

function randomServiceId() {
  return Math.floor((Math.random() * 18000) + 15000) + ''
}

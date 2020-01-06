import couchbase from '../src/db/couchbase'
import {OperatorRoles} from '../src/types/operator'
import {OperatorRepository} from '../src/operator/models'

async function init () {
  await couchbase()
  const tokenPayload = {
    id: 'system',
    permissions: Object.keys(OperatorRoles)
  }

  const token = await OperatorRepository.createToken(tokenPayload)
  console.log('TOKEN', token)
}

init()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })

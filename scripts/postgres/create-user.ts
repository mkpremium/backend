import { createContainer } from '../../bin/create-container'
import { AddOperatorService } from '../../src/user/service/add-operator.service'

const [ username, password, role ] = process.argv.slice(2)

createContainer()
  .then(async container => {
    const addOperatorService = container.resolve('addOperatorService') as AddOperatorService
    await addOperatorService.addOperator({
      username, password, roles: [ role ], profile: {
        firstName: username,
        lastName: '',
        language: 'es',
        email: `test{Math.random()}@test.com`,
        city: 'Barcelona',
      }
    }, { id: 'local' })
    console.log('Operator created')
    process.exit()
  })
  .catch(error => {
    console.error('Error creating container', error)
    console.trace(error)
    throw error
  })

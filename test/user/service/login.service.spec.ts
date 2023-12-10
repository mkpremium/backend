import { createTestContainer } from '../../create-test-container'
import { LoginService } from '../../../src/user/service/login.service'

describe('LoginService#login', () => {
  it('login', async () => {
    const container = await createTestContainer({ couchbase: false, postgres: true })
    const service = container.resolve('loginService') as LoginService

    await service.login({username: 'test-username', password: 'test-password'})
  })
})

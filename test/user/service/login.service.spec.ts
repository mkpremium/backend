import { createTestContainer } from '../../create-test-container'
import { Credentials, LoginService } from '../../../src/user/service/login.service'
import { expect } from 'chai'
import { AddFlipperCommand, AddFlipperService } from '../../../src/flipper/service/add-flipper.service'
import { Factory } from 'rosie'
import { UserProps } from '../../../src/types/user'

describe('LoginService#login', () => {
  it('flipper login', async () => {
    // TODO: disable couchbase
    const container = await createTestContainer({ couchbase: true, postgres: true })
    const addFlipperService = container.resolve('addFlipperService') as AddFlipperService
    const testUser = Factory.build('user', { roles: [] }) as UserProps
    await addFlipperService.addFlipper(<AddFlipperCommand>testUser)

    const service = container.resolve('loginService') as LoginService

    const result = await service.login(<Credentials>testUser)

    expect(result).to.have.keys(
      [ 'access_token', 'operator', 'roles', 'token', 'token_type' ]
    )
  })
})

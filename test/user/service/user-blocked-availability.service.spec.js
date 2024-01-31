import { expect } from 'chai'
import { UserBlockedAvailabilityService } from '../../../src/user/service/user-blocked-availability.service'
import { stub } from 'sinon'
import moment from 'moment'

describe('UserBlockedAvailabilityService', () => {
  /** @var {UserBlockedAvailabilityService} service **/
  let service
  const usersRepositoryStub = {
    get: stub()
  }

  beforeEach(() => {
    service = new UserBlockedAvailabilityService({
      usersRepository: usersRepositoryStub
    })
  })

  it('maps restrictions to blocked availability', () => {
    usersRepositoryStub.get.withArgs('test-user-id').resolves({
      restringedHours: {
        '2020-12-23': [
          {
            start: '10:00',
            end: '11:00'
          }
        ]
      }
    })

    return service.blockedAvailabilityForUser('test-user-id')
      .then(userBlockedAvailability => {
        expect(userBlockedAvailability).to.have.length(1)
        expect(userBlockedAvailability[0]).to.be.eql({
          startsAt: moment('2020-12-23T10:00'),
          endsAt: moment('2020-12-23T11:00')
        })
      })
  })
})

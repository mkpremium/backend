import { AddMeetingService } from '../../../src/scheduled-events/service/add-meeting.service'
import { expect } from 'chai'

describe('AddMeetingService', () => {
  let service

  beforeEach(() => {
    service = new AddMeetingService()
  })

  it('works!', () => {
    expect(service).to.not.be.undefined
  })
})

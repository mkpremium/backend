import { expect } from 'chai'
import moment from 'moment'
import { operatorCreateBusiness } from '../../test/common'
import {
  associateBuildingWithOwner,
  createBuilding,
  createOwner,
  createProposalForBuilding,
  testContactPhone,
  testOwnerName,
  testPhoneContactId
} from '../helper/mother-of-objects'
import { authenticatedGet, authenticatedPost, initApplication } from '../helper/rest-api-helper'

describe('Users Meetings', () => {
  let app, businessUser

  before(async () => {
    app = await initApplication()
    businessUser = await operatorCreateBusiness()
  })

  it(`exposes endpoint to get user's meetings`, async () => {
    await authenticatedGet(`/me/meetings`, businessUser, app)
      .then(response => {
        expect(response.status).to.be.equal(200)
        expect(response.body).to.be.deep.equal([])
      })
  })

  it(`retrieves users's meetings`, async () => {
    const owner = await createOwner(app)
    const building = await createBuilding(app, owner)
    await associateBuildingWithOwner(app, owner, building.id)
    const buildingProposal = await createProposalForBuilding(app, businessUser, building)

    const meetingDate = moment().add(1, 'day').hour(12).minute(0)
    const meeting = {
      'createdBy': businessUser.id,
      'notifyTo': businessUser.id,
      'event': {
        'contactId': testPhoneContactId,
        'ownerId': owner.id,
        'buildingId': building.id,
        'worksheetId': undefined,
        'eventAddress': 'Event Address',
        'eventLocation': { lat: 0, long: 0 },
        'inPerson': true
      },
      'notifyAt': meetingDate.toISOString(),
      'eventDate': meetingDate.toISOString()
    }

    let meetingId
    await authenticatedPost(`/scheduled-events/meeting`, businessUser, app, meeting)
      .then(response => {
        expect(response.status).to.be.equal(201)
        meetingId = response.body.id
      })

    await authenticatedGet(`/me/meetings`, businessUser, app)
      .then(response => {
        expect(response.status).to.be.equal(200)
        const expectedMeeting = {
          id: meetingId,
          meetingAddress: meeting.event.eventAddress,
          meetingAt: meetingDate.toISOString(),
          buildingId: building.id,
          inPerson: true,
          proposalValue: buildingProposal.proposal,
          phoneNumber: testContactPhone,
          contactName: testOwnerName
        }
        expect(response.body).to.be.deep.equal([ expectedMeeting ])
      })
  })
})

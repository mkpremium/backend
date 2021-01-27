import t from 'tcomb'
import { ClientError } from '../../infrastructure/http'

/**
 * @param {CreateMeetingService} createMeetingService
 */
export const createAssignedFlipperScheduleMeetingController = ({ createMeetingService }) => (req, res) => {
  const { flipperId, id: callerId } = req.user
  let createMeetingRequest
  try {
    createMeetingRequest = ScheduleMeetingForAssignedFlipperRequest(req.body)
  } catch (error) {
    throw new ClientError(`Invalid body to schedule meeting for flipper: ${error.message}`)
  }

  return createMeetingService.createMeeting(req.user.operator, {
    createdBy: callerId,
    notifyTo: flipperId,
    eventDate: createMeetingRequest.meetingAt,
    notifyAt: createMeetingRequest.meetingAt,
    event: {
      buildingId: createMeetingRequest.buildingId,
      contactId: createMeetingRequest.contactId,
      eventAddress: createMeetingRequest.eventAddress,
      ownerId: createMeetingRequest.ownerId,
      worksheetId: createMeetingRequest.worksheetId
    }
  }).then(() => {
    res.status(201).json()
  })
}

const ScheduleMeetingForAssignedFlipperRequest = t.struct({
  meetingAt: t.String,
  contactId: t.String,
  eventAddress: t.String,
  ownerId: t.String,
  worksheetId: t.String,
  buildingId: t.String
})

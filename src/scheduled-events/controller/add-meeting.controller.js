/**
 * @param {CreateMeetingService} createMeetingService
 */
export const createAddScheduledMeetingEventController = ({ createMeetingService }) => {
  return async (req, res) => {
    const scheduledEvent = await createMeetingService.createMeeting(req.user.operator, req.body)
    res.status(201).json(scheduledEvent)
  }
}

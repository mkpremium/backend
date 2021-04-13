/**
 * @param {GetSelfMeetingsService} selfMeetingsRepository
 */
export const selfMeetingsController = ({ selfMeetingsRepository }) => {
  return async (req, res) => {
    const userMeetings = await selfMeetingsRepository.getMeetingsFor(req.user.id)
    res.send(userMeetings)
  }
}

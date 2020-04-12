export const getUserMeetingsController = getUserMeetingsService => {
  return async (req, res) => {
    const userMeetings = await getUserMeetingsService.getMeetingsFor(req.user.id)
    res.send(userMeetings)
  }
}

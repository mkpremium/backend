import { wrap } from 'express-promise-wrap'

export const createGetUserScheduledCallsController = scheduledCallsService => wrap(async (req, res) => {
  const userId = req.user.id

  const scheduledCalls = await scheduledCallsService.scheduledCallsFor(userId)

  res.json({ userId, scheduledCalls })
})

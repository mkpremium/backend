const { dependenciesPromise } = require('../src/app')

const { ScheduledEventsRepository } = require('../src/scheduled-events/models')
const missingMeetings = require('../missing_meetings')

dependenciesPromise.then(() => {
  const repo = new ScheduledEventsRepository()

  Promise.all(missingMeetings.map(({scheduledEvent}) =>
    repo.firebaseMeeting(scheduledEvent)
        .then(() => console.log("saved", scheduledEvent.id))
        .catch(console.error)
  ))
    .then(() => console.log("done") && process.exit())
    .catch((err) => console.error(err) && process.exit(1))
})




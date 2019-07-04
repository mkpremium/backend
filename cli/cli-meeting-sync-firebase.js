#!/usr/bin/env babel-node
import program from 'commander';
import Promise from 'bluebird';
import couchbase from '../src/db/couchbase';
import {ScheduledEventsRepository} from '../src/scheduled-events/models';

program
  .option('-M --meeting <meeting>', 'meeting id')
  .action(mainAction)
  .parse(process.argv);

function mainAction() {
  main.apply(null, arguments)
    .then(() => {
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

async function main() {
  await couchbase();

  if (program.meeting) {
    return syncOneMeetings(program.meeting);
  } else {
    return syncAllMeetings();
  }
}

async function syncOneMeetings(meetingId) {
  const repo = new ScheduledEventsRepository();
  const meeting = await repo.findByIdOrThrow(meetingId);

  return syncMeetingFirebase(meeting);
}

async function syncAllMeetings() {
  const repo = new ScheduledEventsRepository();
  const meetings = await repo.findAllMeetings();

  await Promise.map(meetings, syncMeetingFirebase);
}

async function syncMeetingFirebase(scheduledEvent) {
  const repo = new ScheduledEventsRepository();
  await repo.firebaseMeeting(scheduledEvent);
}

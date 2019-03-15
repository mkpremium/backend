#!/usr/bin/env babel-node
import program from 'commander';
import Promise from 'bluebird';
import couchbase from '../src/db/couchbase';
import {ScheduledEventsRepository} from '../src/scheduled-events/models';
import {denormalizeBuildingData, denormalizeBuildingMeeting} from '../src/firebase/lib/business';

program
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

  const repo = new ScheduledEventsRepository();
  const meetings = await repo.findAllMeetings();

  await Promise.map(meetings, syncMeetingFirebase);
}

async function syncMeetingFirebase(scheduledEvent) {
  const repo = new ScheduledEventsRepository();
  const meeting = await repo.findMeeting(scheduledEvent);
  return denormalizeBuildingData(meeting.notifyTo, meeting);
}

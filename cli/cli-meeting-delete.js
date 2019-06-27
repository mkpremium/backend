#!/usr/bin/env babel-node
import '../src/types';
import program from 'commander';
import Promise from 'bluebird';
import {actionWrapper} from './lib';
import {WorksheetRepository} from '../src/worksheet/models/worksheet';
import {BuildingRepository} from '../src/building/models';
import {ScheduledEventsRepository} from '../src/scheduled-events/models';

if (require.main === module) {
  program
    .option('-W --worksheet <worksheet>', 'worksheet id')
    .version('0.0.1')
    .action(actionWrapper(main))
    .parse(process.argv);
}

async function main() {
  const worksheetId = program.worksheet;

  if (!worksheetId) {
    program.help();
  }
  const options = {concurrency: 1};
  const repo = new WorksheetRepository();
  const meetingRepo = new ScheduledEventsRepository();

  const worksheet = await repo.findByIdOrThrow(worksheetId);
  const buildingId = worksheet.relatedBuildingIds[0];

  const updatedWorksheet = worksheet.cleanMeetings();

  await repo.save(updatedWorksheet, false);

  const worksheetMeetings = await WorksheetRepository.findMeetings(worksheetId);

  if (worksheetMeetings.length > 0) {
    console.log('deleting worksheet', worksheetId, 'meetings');
    await Promise.map(worksheetMeetings, meeting => {
      console.log('deleting meeting', meeting.id);
      return meetingRepo.delete(meeting.id);
    }, options);
  }

  const buildingMeetings = await BuildingRepository.findMeetings(buildingId);

  if (buildingMeetings.length > 0) {
    console.log('deleting worksheet', worksheetId, 'meetings, using building', buildingId);
    await Promise.map(buildingMeetings, meeting => {
      console.log('deleting meeting', meeting.id);
      return meetingRepo.delete(meeting.id);
    }, options);
  }
}

import {WorksheetRepository} from '../../src/worksheet/models/worksheet';
import {OwnerRepository, PersonRepository} from '../../src/owner/models';
import {HistoryRepository} from '../../src/history/models';
import {Calls, CallsRawEvents} from '../../src/calls/models';
import {ScheduledEventsRepository} from '../../src/scheduled-events/models';
import {BuildingProposalRepository, BuildingRepository, MetadataRepository} from '../../src/building/models';
import {OperatorStats} from '../../src/stats/models';
import Promise from 'bluebird';
import {cleanFirebase} from '../../migrations/firebase-clean';
import {WorksheetQueueRepository} from '../../src/worksheet/models/queue';
import {N1qlQuery} from 'couchbase';
import {NoteRepository} from '../../src/notes/models';

export async function clean(clean = false) {
  if (!clean) return;

  await deleteAll();
}

export async function cleanNotes(clean = false) {
  if (!clean) return;
  const notes = new NoteRepository();
  await notes.deleteQuery();
}

export async function deleteAll() {
  const worksheet = new WorksheetRepository();
  const owner = new OwnerRepository();
  const history = new HistoryRepository();
  const calls = new Calls();
  const callUnknownEvents = new CallsRawEvents();
  const scheduledEvent = new ScheduledEventsRepository();
  const building = new BuildingRepository();
  const stats = new OperatorStats();
  const meta = new MetadataRepository();
  const personRepository = new PersonRepository();
  const buildingProposal = new BuildingProposalRepository();

  return Promise.mapSeries([
    cleanFirebase(),
    meta.deleteQuery(),
    worksheet.deleteQuery(),
    owner.deleteQuery(),
    personRepository.deleteQuery(),
    building.deleteQuery(),
    history.deleteQuery(),
    calls.deleteQuery(),
    scheduledEvent.deleteQuery(),
    callUnknownEvents.deleteQuery(),
    stats.deleteQuery(),
    buildingProposal.deleteQuery(),
    cleanQueue(),
    cleanNotes(true)
  ]);
}

export async function cleanQueue() {
  const repo = new WorksheetQueueRepository();
  const bucket = repo.getBucketName();
  const cleanQueues = N1qlQuery.fromString(`UPDATE ${bucket} t SET worksheets = [], worksheetIndex = undefined WHERE t._documentType = 'worksheet-queue'`);
  const resetCounter = N1qlQuery.fromString(`DELETE FROM ${bucket} t WHERE META().id = 'counter:worksheet'`);
  await repo.queryRaw(cleanQueues);
  await repo.queryRaw(resetCounter);
}

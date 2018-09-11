import {N1qlQuery} from 'couchbase';
import couchbase from '../src/db/couchbase';
import {MigrateModel} from '../src/migration/lib/migrate-model';
import {resolve} from 'path';
import {RelatedModel} from '../src/migration/lib/related-model';
import {MigrateEntities} from '../src/migration/lib/migrate-entities';
import Promise from 'bluebird';
import {cleanFirebase} from './firebase-clean';
import {WorksheetRepository} from '../src/worksheet/models/worksheet';
import {OwnerRepository, PersonRepository} from '../src/owner/models';
import {HistoryRepository} from '../src/history/models';
import {Calls, CallsRawEvents} from '../src/calls/models';
import {ScheduledEventsRepository} from '../src/scheduled-events/models';
import {BuildingRepository} from '../src/building/models';
import {OperatorStats} from '../src/stats/models';
import {CityRepository, NeighborhoodRepository} from '../src/street/models';
import {WorksheetQueueRepository} from '../src/worksheet/models/queue';

export async function seed(files) {
  const app = {
    locals: {
      bucket: await couchbase()
    }
  };

  await deleteAll();
  await cleanQueue();

  const migrateBuildings = new MigrateModel('building', files.buildings, app);
  const migrateOwners = new MigrateModel('owner', files.owners, app);
  const migrateWorksheets = new MigrateModel('worksheet', files.calls, app);
  const migratePeople = new MigrateModel('person', files.people, app);
  const relations = new RelatedModel(files.cross, app);
  const buildingEntities = new MigrateEntities(files.entities, app);

  await migratePeople.run();
  await migrateBuildings.run();
  await migrateOwners.run();
  await migrateWorksheets.run();
  await relations.run();
  await buildingEntities.run();
}

async function deleteAll() {
  const worksheet = new WorksheetRepository();
  const people = new PersonRepository();
  const owner = new OwnerRepository();
  const history = new HistoryRepository();
  const calls = new Calls();
  const callUnknownEvents = new CallsRawEvents();
  const scheduledEvent = new ScheduledEventsRepository();
  const building = new BuildingRepository();
  const stats = new OperatorStats();
  const neighborhood = new NeighborhoodRepository();
  const city = new CityRepository();

  return Promise.all([
    cleanFirebase(),
    worksheet.deleteQuery(),
    people.deleteQuery(),
    owner.deleteQuery(),
    building.deleteQuery(),
    history.deleteQuery(),
    calls.deleteQuery(),
    scheduledEvent.deleteQuery(),
    callUnknownEvents.deleteQuery(),
    stats.deleteQuery(),
    neighborhood.deleteQuery(),
    city.deleteQuery()
  ]);
}

async function cleanQueue() {
  const repo = new WorksheetQueueRepository();
  const cleanQueues = N1qlQuery.fromString(`UPDATE mkpremium t SET worksheets = [], worksheetIndex = undefined WHERE t._documentType = 'worksheet-queue'`);
  const resetCounter = N1qlQuery.fromString('DELETE FROM mkpremium t WHERE META().id = \'counter:worksheet\'');
  await repo.queryRaw(cleanQueues);
  await repo.queryRaw(resetCounter);
}

function resolvePath(filename) {
  const csvFolder = 'csv';
  return resolve(__dirname, '..', csvFolder, filename);
}

const defaultFiles = {
  people: resolvePath('PERSONAS.csv'),
  buildings: resolvePath('EDIFICIOS.csv'),
  owners: resolvePath('PROPIETARIOS.csv'),
  calls: resolvePath('LLAMADAS.csv'),
  cross: resolvePath('cross_table.csv'),
  entities: resolvePath('SITARR.csv')
};

if (require.main === module) {
  console.log('starting seed');
  seed(defaultFiles)
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

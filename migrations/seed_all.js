import couchbase from '../src/db/couchbase';
import {MigrateModel} from '../src/migration/lib/migrate-model';
import {resolve} from 'path';
import {
  createFullOperator, deleteAll, operatorCreateAdmin,
  operatorCreateManager
} from '../test/common';
import {RelatedModel} from '../src/migration/lib/related-model';
import {MigrateEntities} from '../src/migration/lib/migrate-entities';

export async function seed(files) {
  const app = {
    locals: {
      bucket: await couchbase()
    }
  };
  await deleteAll();
  await createFullOperator({
    username: `operator`,
    password: 'Passw0rd',
    agentNumber: `10106-919`,
    serviceId: '17146',
    roles: [
      'OPERATOR'
    ],
    profile: {
      firstName: 'Operador',
      lastName: 'Prueba',
      city: 'barcelona'
    }
  });
  await operatorCreateAdmin();
  await operatorCreateManager();

  const migrateBuildings = new MigrateModel('building', files.buildings, app);
  const migrateOwners = new MigrateModel('owner', files.owners, app);
  const migrateWorksheets = new MigrateModel('worksheet', files.calls, app);
  const migratePeople = new MigrateModel('person', files.people, app);
  const relations = new RelatedModel(files.cross, app);
  const buildingEntities = new MigrateEntities(files.entities, app);

  // await migratePeople.run();
  await migrateBuildings.run();
  await migrateOwners.run();
  await migrateWorksheets.run();
  await relations.run();
  await buildingEntities.run();
}

const defaultFiles = {
  people: resolve(__dirname, '../csv/PERSONAS.csv'),
  buildings: resolve(__dirname, '../csv/EDIFICIOS.csv'),
  owners: resolve(__dirname, '../csv/PROPIETARIOS.csv'),
  calls: resolve(__dirname, '../csv/LLAMADAS.csv'),
  cross: resolve(__dirname, '../csv/cross_table.csv'),
  entities: resolve(__dirname, '../csv/SITARR.csv')
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

import app from '../src/app';

import {MigrateModel} from '../src/migration/lib/migrate-model';
import {resolve} from 'path';
import {
  createFullOperator, deleteAll, operatorCreateAdmin,
  operatorCreateManager
} from '../test/common';
import {RelatedModel} from '../src/migration/lib/related-model';

export async function seed(files) {
  await app.locals.bucketPromise;
  await deleteAll();
  await createFullOperator({
    username: `operator`,
    password: 'operator',
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
  const relations = new RelatedModel(files.cross, app);

  await migrateBuildings.run();
  await migrateOwners.run();
  await migrateWorksheets.run();
  await relations.run();
}

const defaultFiles = {
  buildings: resolve(__dirname, '../csv/EDIFICIOS.csv'),
  owners: resolve(__dirname, '../csv/PROPIETARIOS.csv'),
  calls: resolve(__dirname, '../csv/LLAMADAS.csv'),
  cross: resolve(__dirname, '../csv/cross_table.csv')
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

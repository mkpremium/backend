import couchbase from '../src/db/couchbase';
import {resolve} from 'path';
import {RelatedOwnerBuildingModel} from '../src/migration/lib/related-owner-building-model';

export async function seed(files) {
  const app = {
    locals: {
      bucket: await couchbase()
    }
  };

  const relations = new RelatedOwnerBuildingModel(files.cross, app);
  await relations.run();
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

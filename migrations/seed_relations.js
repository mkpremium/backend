import couchbase from '../src/db/couchbase';
import {resolve} from 'path';
import {RelatedOwnerBuildingModel} from '../src/migration/lib/related-owner-building-model';
import {defaultFiles} from './defaults';

export async function seed(files) {
  const app = {
    locals: {
      bucket: await couchbase()
    }
  };

  const relations = new RelatedOwnerBuildingModel(files.cross, app);
  await relations.run();
}

if (require.main === module) {
  console.log('starting seed');
  seed(defaultFiles)
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

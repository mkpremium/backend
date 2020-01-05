import couchbase from '../src/db/couchbase';
import {readCodigosPostalesMunicipios} from '../csv/codigos_postales_municipios';
import {MigratePersonModel} from '../src/migration/lib/migrate-person';
import {defaultFiles} from './defaults';

async function init(people) {
  const app = {
    locals: {
      bucket: await couchbase()
    }
  };

  await processPeople(people, app);
}

async function processPeople(people, app) {
  const codes = await readCodigosPostalesMunicipios();
  const peopleMigration = new MigratePersonModel(people, codes, app);
  return peopleMigration.run();
}

if (require.main === module) {
  init(defaultFiles.people)
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

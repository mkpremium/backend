import {readCodigosPostalesMunicipios} from '../../csv/codigos_postales_municipios';
import {MigratePersonModel} from "../../src/migration/lib/migrate-person";
import couchbase from "../../src/db/couchbase";


export async function migratePersons(inputFile) {
  const app = {
    locals: {
      bucket: await couchbase()
    }
  };
  const codes = await readCodigosPostalesMunicipios();
  const peopleMigration = new MigratePersonModel(inputFile, codes, app);
  return peopleMigration.run();
}

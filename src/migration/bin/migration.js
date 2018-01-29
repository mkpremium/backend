import minimist from 'minimist';
import {MigrateModel} from '../lib/migrate-model';

const options = {
  default: {},
  string: [
    'model',
    'file'
  ],
  alias: {
    f: 'file',
    m: 'model'
  }
};
const {model, file} = minimist(process.argv.slice(2), options);

const migrate = new MigrateModel(model, file);

migrate.run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

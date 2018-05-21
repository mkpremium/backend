import app from '../src/app-bank';

import {
  createFullOperator
} from '../test/common';
import {MigrateBankCityFile} from '../src/banks/lib/load-bank-file';
import {BankFileRepository} from '../src/banks/models';
import {OperatorRepository} from '../src/operator/models';

async function init() {
  await app.locals.bucketPromise;
  const bankFileRepo = new BankFileRepository();
  const operatorRepo = new OperatorRepository();

  await operatorRepo.deleteQuery();
  await bankFileRepo.deleteQuery();

  await createFullOperator({
    username: `banks`,
    password: 'password',
    roles: [
      'OPERATOR'
    ],
    profile: {
      firstName: 'Banks',
      lastName: 'dev',
      city: 'barcelona'
    }
  });

  const migrate = new MigrateBankCityFile(`${__dirname}/../src/banks/fixtures/bank_city.xlsx`);
  await migrate.run();
}

init()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

import app from '../src/app-bank';

import {
  createFullOperator, deleteAll
} from '../test/common';

async function init() {
  await app.locals.bucketPromise;
  await deleteAll();

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
}

init()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

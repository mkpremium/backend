import Promise from 'bluebird';

import couchbase from '../src/db/couchbase';

import {OperatorActions} from '../src/stats/types';
import {OperatorStats} from '../src/stats/models';
import {createFullOperator, deleteAll, operatorCreateAdmin, operatorCreateManager} from '../test/common';
import {madrid} from '../src/lib/date';

import Chance from 'chance';

async function init() {
  await couchbase();
  const repo = new OperatorStats();

  const days = 365 * 3;

  await deleteAll();
  await repo.deleteQuery();
  const operators = [];
  for (let i = 0; i < 10; i++) {
    const operator = await createFullOperator({
      username: `operator_${i}`,
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
    operators.push(operator);
  }

  await operatorCreateAdmin();
  await operatorCreateManager();

  for (let i = 1; i <= days; i++) {
    await Promise.map(operators, (operator) => {
      const createdAt = madrid(operator.createdAt).add(i, 'days').toDate();
      return seedStats(operator.id, createdAt);
    });
  }
}

const viewPerOperator = {min: 0, max: 200};

const chance = new Chance(12345);

async function seedStats(operatorId, createdAt) {
  const repo = new OperatorStats();

  const views = chance.integer(viewPerOperator);
  const meetings = chance.integer({min: 0, max: views});
  for (let j = 0; j < views; j++) {
    await repo.save({operatorId, action: OperatorActions.VIEW_WORKSHEET, createdAt}, false);
  }

  for (let k = 0; k < meetings; k++) {
    await repo.save({operatorId, action: OperatorActions.MEETING, createdAt}, false);
  }

  const randomEvents = [
    OperatorActions.CALL,
    OperatorActions.CALL_ANSWERED,
    OperatorActions.VERIFIED_OWNER
  ];

  const randomEventsCount = chance.integer({min: 10, max: 100});

  for (let l = 0; l < randomEventsCount; l++) {
    const randomEvent = chance.pickone(randomEvents);
    await repo.save({operatorId, action: randomEvent, createdAt}, false);
  }
}

init()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

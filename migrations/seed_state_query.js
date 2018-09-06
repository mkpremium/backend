import couchbase from '../src/db/couchbase';
import {OperatorStats} from '../src/stats/models';

async function init() {
  await couchbase();
  const repo = new OperatorStats();
  const view = repo.getView('mean_of_carles')
    .group_level(4)
    // .key(JSON.stringify(['20e786bf-219a-4e4d-b642-154d21491027']))
    .range([2018, 9, 5, '3cbfc046-716b-482d-9b28-85e6af131bdb'], [2018, 9, 7, '3cbfc046-716b-482d-9b28-85e6af131bdb'], true);
  const results = await repo.queryRaw(view);
  console.log(results);
}

init()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

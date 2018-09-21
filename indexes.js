import _map from 'lodash/map';
import Promise from 'bluebird';
import {N1qlQuery} from 'couchbase';
import couchbase from './src/db/couchbase';

const indexes = [
  {
    name: 'id',
    query: '(`id`)'
  },
  {
    name: 'building_id',
    query: '(`id`,`_documentType`)'
  },
  {
    name: 'worksheetIndex',
    query: '(`worksheetIndex`,`_documentType`) WHERE `_documentType` = "worksheet"'
  },
  {
    name: '_migratedId',
    query: '(`_migratedId`) '},
  {
    name: '_documentType_migratedId',
    query: '(`_documentType`,`_migratedId`)'
  },
  {
    name: '_documentType_id',
    query: '(`_documentType`,`id`)'
  },
  {
    name: '_documentType',
    query: '(`_documentType`)'
  },
  {
    name: 'operator_roles',
    query: '(ALL TOKENS(`roles`)) WHERE `_documentType` = "operator"'
  },
  {
    name: 'worksheet_status',
    query: '(`status`,`_documentType`) WHERE `_documentType` = "worksheet"'
  },
  {
    name: 'owner_business_status',
    query: '(`business`.`status`) WHERE `_documentType` = "owner" and `business`.`status` IS NOT MISSING'
  },
  {
    name: 'operator_stats_count',
    query: '(city, action, createdAt) WHERE _documentType = \'operator-stats\' AND city IS NOT MISSING'
  },
  {
    name: 'operator_stats_operator_count',
    query: '(operatorId ASC, action, createdAt ASC) WHERE _documentType = \'operator-stats\''
  }
];

async function init() {
  const bucket = await couchbase();
  await Promise.map(indexes, async({name, query}) => {
    try {
      await bucket.queryAsync(N1qlQuery.fromString(`DROP INDEX \`${bucket._name}\`.\`${name}\``));
    } catch (e) {
      console.log('index creating failed', e.message);
    }

    await bucket.queryAsync(N1qlQuery.fromString(`CREATE INDEX ${name} ON ${bucket._name} ${query} USING GSI WITH {"defer_build":true}`));
  });

  // build indexes
  const names = _map(indexes, 'name').map(indexName => `\`${indexName}\``).join(',');
  await bucket.queryAsync(N1qlQuery.fromString(`BUILD INDEX ON \`${bucket._name}\`(${names}) USING GSI`));
}

if (require.main === module) {
  init()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

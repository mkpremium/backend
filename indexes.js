import _map from 'lodash/map';
import Promise from 'bluebird';
import {N1qlQuery} from 'couchbase';
import couchbase from './src/db/couchbase';

const indexes = [
  {name: 'id', query: 'CREATE INDEX `id` ON `mkpremium`(`id`)'},
  {name: 'id_documentType', query: 'CREATE INDEX `building_id` ON `mkpremium`(`id`,`_documentType`)'},
  {
    name: 'worksheetIndex',
    query: 'CREATE INDEX `worksheetIndex` ON `mkpremium`(`worksheetIndex``_documentType`) WHERE (`_documentType` = "worksheet")'
  },
  {name: '_migratedId', query: 'CREATE INDEX `_migratedId` ON `mkpremium`(`_migratedId`) '},
  {
    name: '_documentType_migratedId',
    query: 'CREATE INDEX `_documentType_migratedId` ON `mkpremium`(`_documentType`,`_migratedId`) '
  },
  {name: '_documentType_id', query: 'CREATE INDEX `_documentType_id` ON `mkpremium`(`_documentType`,`id`)'},
  {name: '_documentType', query: 'CREATE INDEX `_documentType` ON `mkpremium`(`_documentType`)'},
  {
    name: 'operator_stats_createdAt',
    query: 'CREATE INDEX `operator_stats_createdAt` ON `mkpremium`(`createdAt`, `_documentType`) WHERE (`_documentType` = "operator-stats")'
  },
  {
    name: 'operator_stats_operator',
    query: 'CREATE INDEX `operator_stats_operator` ON `mkpremium`(`operatorId`, `_documentType`) WHERE (`_documentType` = "operator-stats")'
  },
  {
    name: 'operator_stats_',
    query: 'CREATE INDEX `operator_stats_` ON `mkpremium`(`operatorId`, `createdAt`, `_documentType`) WHERE (`_documentType` = "operator-stats")'
  },
  {
    name: 'operator_roles',
    query: 'CREATE INDEX `operator_roles` ON `mkpremium`(ALL TOKENS(`roles`)) WHERE (`_documentType` = "operator")'
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

    await bucket.queryAsync(N1qlQuery.fromString(`${query} USING GSI WITH {"defer_build":true}`));
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

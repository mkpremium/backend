import csv from 'csvtojson/v1';
import fs from 'fs-extra';
import Promise from 'bluebird';
import debug from 'debug';

const debugCsv = debug('app:lib:csvToJson');

const noOp = () => {
};

const defaultOptions = {
  delimiter: ';',
  fork: true,
  workerNum: 8
};

/**
 *
 * @param filepath
 * @param processFunc
 * @param options
 * @return {Promise<void>}
 */
export async function csvToJson(filepath, processFunc = noOp, options = defaultOptions) {
  await fs.pathExists(filepath);
  return new Promise((resolve, reject) => {
    const queue = [];
    let rowCount = 0;
    csv(options)
      .fromFile(filepath)
      .on('json', function(row) {
        rowCount++;
        if (rowCount % 10000 === 0) {
          debugCsv('batch row couting', rowCount, 'on', filepath);
        }
        queue.push(processFunc(row, rowCount));
      })
      .on('done', function(err) {
        Promise.all(queue.filter(n => n))
          .then(function() {})
          .finally(function() {
            err ? reject(err) : resolve();
          });
      });
  });
}

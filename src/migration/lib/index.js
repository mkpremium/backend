import csv from 'csvtojson';
import fs from 'fs-extra';
import Promise from 'bluebird';

const noOp = () => {
};

const defaultOptions = {
  delimiter: ';'
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
      .on('json', (row) => {
        rowCount++;
        queue.push(processFunc(row, rowCount));
      })
      .on('done', err => {
        Promise.all(queue.filter(n => n))
          .then(() => {})
          .finally(() => {
            err ? reject(err) : resolve();
          });
      });
  });
}

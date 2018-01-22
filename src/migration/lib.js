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
  await fs.ensureFile(filepath);
  return new Promise((resolve, reject) => {
    const queue = [];
    csv(options)
      .fromFile(filepath)
      .on('json', (row) => {
        queue.push(processFunc(row));
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

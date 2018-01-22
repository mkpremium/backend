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
    csv(options)
      .fromFile(filepath)
      .on('json', processFunc)
      .on('done', err => err ? reject(err) : resolve());
  });
}

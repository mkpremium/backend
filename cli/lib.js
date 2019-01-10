import path from 'path';
import lodash from 'lodash';
import fs from 'fs-extra';
import {exec} from 'child_process';

/**
 * Check if the list of passed files exists on the passed directory
 *
 * @param inputDir
 * @param inputs
 * @returns {Promise<{}>} a list of absolute file paths
 */
export async function checkInputs(inputDir, inputs) {
  async function fileExists(file) {
    const filepath = path.join(inputDir, file);
    const exist = await fs.pathExists(filepath);
    if (!exist) {
      throw new Error(`there's no file ${file} on the passed directory ${inputDir}`);
    }
    return path.resolve(filepath);
  }

  const fullPaths = await Promise.all(inputs.map(fileExists));

  return lodash.zipObject(inputs, fullPaths);
}

/**
 * Read f¡st line of a file and check for an expected line
 * @throws
 * @param inputFile
 * @param expectedHeaders
 * @returns {Promise<void>}
 */
export async function validateHeaders(inputFile, expectedHeaders) {
  const headers = await head(inputFile);
  const headerWithoutLines = headers.replace(/[\n\r]/g, '');
  if (headerWithoutLines !== expectedHeaders) {
    throw new Error(`${inputFile} should have the following first line '${expectedHeaders}', but found '${headerWithoutLines}'`);
  }
}

/**
 * Read number of lines of a file
 * @param filename
 * @param number
 * @returns {Promise<string>}
 */
export async function head(filename, number = 1) {
  return new Promise((resolve, reject) => {
    exec(`head -n${number} '${filename}'`, (err, stdout) => {
      if (err) {
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
}

export function actionWrapper(fn) {
  return () => {
    fn.apply(null, arguments)
      .then(() => {
        process.exit(0);
      })
      .catch(err => {
        console.error(err);
        process.exit(1);
      });
  };
}

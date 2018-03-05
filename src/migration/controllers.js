import Promise from 'bluebird';
import {resolve} from 'path';
import {wrap} from 'express-promise-wrap';
import _mapValues from 'lodash/mapValues';

import pkg from '../../package';

import {uploadDir} from '../../config';

export const migrationViewController = (req, res) => {
  res.render('migration', {
    submitted: false,
    package: pkg
  });
};

async function uploadFiles(req, res) {
  const files = await Promise.props(_mapValues(req.files, async(file, fileKey) => {
    const name = resolve(uploadDir, `${fileKey}.csv`);
    await file.mv(name);
    return name;
  }));

  const gearman = req.app.locals.gearman;

  const job = gearman.submitJob('cross', JSON.stringify(files));

  job.on('complete', () => {
    console.log('cross completed');
    gearman.submitJob('seed', job.response);
  });

  res.render('migration', {
    submitted: true,
    package: pkg
  });
}

export const uploadFilesController = wrap(uploadFiles);

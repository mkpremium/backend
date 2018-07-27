import multer from 'multer';
import {wrap} from 'express-promise-wrap';
import {compose} from 'compose-middleware';

import pkg from '../../package';
import {storage} from '../../config';

const files = multer({storage}).fields([
  {name: 'calls', maxCount: 1},
  {name: 'owners', maxCount: 1},
  {name: 'buildings', maxCount: 1},
  {name: 'people', maxCount: 1}
]);

export const migrationViewController = (req, res) => {
  res.render('migration', {
    submitted: false,
    package: pkg
  });
};

async function uploadFiles(req, res) {
  const files = {};
  Object.keys(req.files).forEach(key => {
    files[key] = req.files[key][0].path;
  });

  const gearman = req.app.locals.gearman;

  const job = gearman.submitJob('cross', JSON.stringify(files));

  job.on('complete', () => {
    gearman.submitJob('seed', job.response);
  });

  res.render('migration', {
    submitted: true,
    package: pkg
  });
}

export const uploadFilesController = compose([files, wrap(uploadFiles)]);

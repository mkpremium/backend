import multer from 'multer';
import {wrap} from 'express-promise-wrap';
import {compose} from 'compose-middleware';
import {BankFileRepository} from './models';

import {storage} from '../../config';

const bankFile = multer({storage}).single('file');

export async function listBankFiles(req, res) {
  const repo = new BankFileRepository();
  const qb = repo.getQueryBuilder();
  qb
    .order('createdAt DESC')
    .limit(5);

  const results = repo.query(qb);

  res.json({results});
}

export async function uploadBankFile(req, res) {
  const gearman = req.app.locals.gearman;
  const repo = new BankFileRepository(gearman);
  const bankFile = await repo.processFile(req.file);
  res.status(201).json(bankFile);
}

export const listBankFilesController = wrap(listBankFiles);
export const uploadBankFileController = compose([bankFile, wrap(uploadBankFile)]);

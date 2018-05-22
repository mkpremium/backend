import multer from 'multer';
import {wrap} from 'express-promise-wrap';
import {compose} from 'compose-middleware';
import {BankFileRepository} from './models';

import {storage} from '../../config';

const bankFile = multer({storage}).single('file');

export async function listBankFiles(req, res) {
  const repo = new BankFileRepository();
  const response = await repo.list();
  res.json(response);
}

export async function uploadBankFile(req, res) {
  const gearman = req.app.locals.gearman;
  const repo = new BankFileRepository(gearman);
  const bankFile = await repo.processFile(req.file);
  res.status(201).json(bankFile);
}

export async function getBankFile(req, res) {
  const bankFileId = req.params.id;
  const repo = new BankFileRepository();
  const bankFile = await repo.findByIdOrThrow(bankFileId);
  const response = BankFileRepository.single(bankFile);
  res.json(response);
}

export const listBankFilesController = wrap(listBankFiles);
export const uploadBankFileController = compose([bankFile, wrap(uploadBankFile)]);
export const getBankFileController = wrap(getBankFile);

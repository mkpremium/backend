import multer from 'multer';
import {wrap} from 'express-promise-wrap';
import {compose} from 'compose-middleware';
import {BankFileDataRepository, BankFileRepository} from './models';

import {storage} from '../../config';

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
  const dataRepo = new BankFileDataRepository();
  const bankFileRaw = await repo.findByIdOrThrow(bankFileId);
  const bankFileData = await dataRepo.findByFileBankId(bankFileId);
  const bankFile = BankFileRepository.single(bankFileRaw);
  res.json({
    bankFile,
    bankFileData
  });
}

export async function calculateFilters(req, res) {
  const repo = new BankFileRepository();
  const bankFileId = req.params.id;
  const response = await repo.calculateFilter(bankFileId, req.body);
  res.json(response);
}

const bankFile = multer({storage}).single('file');

export const listBankFilesController = wrap(listBankFiles);
export const uploadBankFileController = compose([bankFile, wrap(uploadBankFile)]);
export const getBankFileController = wrap(getBankFile);
export const calculateFiltersController = wrap(calculateFilters);

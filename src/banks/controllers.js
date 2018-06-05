import fs from 'fs';
import multer from 'multer';
import {wrap} from 'express-promise-wrap';
import {compose} from 'compose-middleware';
import {BankFileDataRepository, BankFileRepository, BanksCityDataRepository} from './models';

import {storage} from '../../config';
import {MigrateBankCityFile} from './lib/load-bank-file';

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

export async function exportBankFile(req, res) {
  const repo = new BankFileRepository();
  const bankFileId = req.params.id;
  const result = await repo.exportFile(bankFileId, req.body);
  res.set('cContent-Type', result.bankFile.mimetype);
  res.set('Content-Disposition', `attachment;filename=${result.bankFile.filename}`);
  fs.createReadStream(result.exported).pipe(res);
}

export async function actionBankFileData(req, res) {
  const repo = new BankFileRepository();
  const bankFile = await repo.doFilterAction(req.params, req.body);
  res.json(bankFile);
}

export async function actionBankFileDataWithXLSX(req, res) {
  const repo = new BankFileRepository();
  const bankFile = await repo.doFilterActionXLSX(req.params, req.file);
  res.json(bankFile);
}

export async function removeBankFile(req, res) {
  const bankFileId = req.params.id;
  const repo = new BankFileRepository();
  await repo.deleteBankFile(bankFileId);
  res.status(204).send();
}

export async function updateBankCityData(req, res) {
  const repo = new BanksCityDataRepository();
  await repo.deleteQuery();
  const migrate = new MigrateBankCityFile(req.file.path, req.app.locals.bucket);
  await migrate.run();
  res.status(204).send();
}

const bankFile = multer({storage}).single('file');

export const listBankFilesController = wrap(listBankFiles);
export const uploadBankFileController = compose([bankFile, wrap(uploadBankFile)]);
export const getBankFileController = wrap(getBankFile);
export const calculateFiltersController = wrap(calculateFilters);
export const exportBankFileController = wrap(exportBankFile);
export const actionBankFileDataController = wrap(actionBankFileData);
export const actionBankFileDataWithXLSXController = compose([bankFile, wrap(actionBankFileDataWithXLSX)]);
export const removeBankFileController = wrap(removeBankFile);
export const updateBankCityDataController = compose([bankFile, wrap(updateBankCityData)]);

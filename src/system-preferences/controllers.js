import {wrap} from 'express-promise-wrap';
import {SystemPreferencesRepository} from './models';

async function getSystemPreferences(req, res) {
  const pref = SystemPreferencesRepository.getPreferences();
  res.json(pref);
}

async function writeSystemPreferences(req, res) {
  await SystemPreferencesRepository.writePreferences(req.body || {});
  res.status(204).send();
}

export const getSystemPreferencesController = wrap(getSystemPreferences);
export const writeSystemPreferencesController = wrap(writeSystemPreferences);

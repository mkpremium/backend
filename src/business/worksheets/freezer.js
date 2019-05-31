import debug from 'debug';
import {Worksheet} from '../../types/worksheet';
import {WorksheetRepository} from '../../worksheet/models/worksheet';
import {utc} from '../../lib/date';
import Promise from 'bluebird';
import fromJSON from 'tcomb/lib/fromJSON';
import {SystemPreferencesRepository} from '../../system-preferences/models';

const debugFreezer = debug('app:worksheets:freezer');

export async function moveWorksheetOutOfFreezer() {
  const {freezer} = await SystemPreferencesRepository.getPreferences();
  debugFreezer('starting to move worksheets from freezer settings', freezer);
  await moveWorksheetToStatus(freezer.daysInFreezer, freezer.fromState, freezer.toState);
  debugFreezer('end of freezer process');
}

export async function moveWorksheetToStatus(days, fromState, toState) {
  const maxDays = utc().subtract(days, 'days').toDate();
  const repository = new WorksheetRepository();
  const queryBuilder = repository.getQueryBuilder()
    .where('status = ?', fromState)
    .where('statusChangedAt <= ?', maxDays)
    .limit(100);

  const worksheets = await repository.query(queryBuilder);
  const updatedWorksheets = worksheets.map(worksheet => {
    debugFreezer(`moving out freezer worksheet '${worksheet.id}', last status changed at: '${worksheet.statusChangedAt}'`);
    return fromJSON(worksheet, Worksheet).setStatus(toState);
  });

  const saveWorksheet = (worksheet) => repository.save(worksheet, false);

  await Promise.map(updatedWorksheets, saveWorksheet, {concurrency: 3});
}

import {Worksheet, WorkSheetStatus} from '../../types/worksheet';
import {WorksheetRepository} from '../../worksheet/models/worksheet';
import {utc} from '../../lib/date';
import Promise from 'bluebird';
import fromJSON from 'tcomb/lib/fromJSON';

export async function moveWorksheetOutOfFreezer() {
  return moveWorksheetToStatus(90, WorkSheetStatus.NO_SALE, WorkSheetStatus.WITH_OWNER);
}

export async function moveWorksheetToStatus(days, fromState, toState) {
  const maxDays = utc().subtract(days, 'days').toDate();
  const repository = new WorksheetRepository();
  const queryBuilder = repository.getQueryBuilder()
    .where('status = ?', fromState)
    .where('statusChangedAt <= ?', maxDays)
    .limit(100);

  const worksheets = await repository.query(queryBuilder);
  const updatedWorksheets = worksheets.map(worksheet => fromJSON(worksheet, Worksheet).setStatus(toState));

  const saveWorksheet = (worksheet) => repository.save(worksheet, false);

  await Promise.map(updatedWorksheets, saveWorksheet, {concurrency: 3});
}

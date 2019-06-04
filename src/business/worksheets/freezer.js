import debug from 'debug';
import {Worksheet} from '../../types/worksheet';
import {WorksheetRepository} from '../../worksheet/models/worksheet';
import {utc} from '../../lib/date';
import Promise from 'bluebird';
import fromJSON from 'tcomb/lib/fromJSON';
import {SystemPreferencesRepository} from '../../system-preferences/models';
import {OwnerRepository} from '../../owner/models';
import {OwnerStatus} from '../../types/enums';

const debugFreezer = debug('app:worksheets:freezer');

export async function moveWorksheetOutOfFreezer() {
  const {freezer} = await SystemPreferencesRepository.getPreferences();
  debugFreezer('starting to move worksheets from freezer settings', freezer);
  await moveWorksheetToStatus(freezer);
  debugFreezer('end of freezer process');
}

export async function moveWorksheetToStatus({days, fromState, toState, provinces}) {
  const maxDays = utc().subtract(days, 'days').toDate();
  const repository = new WorksheetRepository();
  const queryBuilder = repository.getQueryBuilder()
    .where('status = ?', fromState)
    .where('statusChangedAt <= ?', maxDays)
    .limit(100);

  if (provinces.length > 0) {
    queryBuilder.where(`buildingAddress.province IN ${JSON.stringify(provinces)}`);
  }

  const worksheets = await repository.query(queryBuilder);
  const updatedWorksheets = worksheets.map(worksheet => {
    debugFreezer(`moving out freezer worksheet '${worksheet.id}', last status changed at: '${worksheet.statusChangedAt}'`);
    return fromJSON(worksheet, Worksheet).setStatus(toState);
  });

  if (updatedWorksheets.length === 0) {
    return;
  }

  const saveWorksheet = async(worksheet) => {
    await repository.save(worksheet, false);
    await moveOwnerStatus(worksheet.relatedBuildingIds[0], OwnerStatus.NO_SALE, OwnerStatus.VERIFIED);
  };

  await Promise.map(updatedWorksheets, saveWorksheet, {concurrency: 3});
}

export async function moveOwnerStatus(buildingId, fromState, toState) {
  const repository = new OwnerRepository();
  const owners = await repository.findOwnersByBuildingId(buildingId);
  const ownersToChange = owners.filter(owner => owner.status === fromState);
  if (ownersToChange.length === 0) {
    debugFreezer('there is not owners for this worksheet to change');
    return;
  }

  const updatedOwners = ownersToChange.map(owner => {
    debugFreezer(`moving owner ${owner.id} with current status ${owner.status} to ${toState}`);
    return owner.setStatus(toState);
  });

  const saveOwner = owner => repository.save(owner, false);
  await Promise.map(updatedOwners, saveOwner, {concurrency: 3});
}

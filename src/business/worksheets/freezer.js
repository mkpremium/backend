import debug from 'debug';
import {Worksheet, WorkSheetStatus} from '../../types/worksheet';
import {WorksheetRepository} from '../../worksheet/models/worksheet';
import {utc} from '../../lib/date';
import Promise from 'bluebird';
import fromJSON from 'tcomb/lib/fromJSON';
import {SystemPreferencesRepository} from '../../system-preferences/models';
import {OwnerRepository} from '../../owner/models';
import {OwnerStatus} from '../../types/enums';
import {removeBuildingFromBusiness} from '../../firebase/lib/business';

const debugFreezer = debug('app:worksheets:freezer');

export async function moveWorksheetOutOfFreezer() {
  const {freezer} = await SystemPreferencesRepository.getPreferences();
  debugFreezer('starting to move worksheets from freezer settings', freezer);
  await moveNoSaleWorksheets(freezer);
  await moveFreezerWorksheets(freezer);
  debugFreezer('end of freezer process');
}

export async function putWorksheetOnFreezer(worksheet) {
  const repository = new WorksheetRepository();
  const updatedWorksheet = fromJSON(worksheet, Worksheet).putOnFreezer();
  return repository.save(updatedWorksheet, false);
}

export async function moveFreezerWorksheets({days, provinces}) {
  const maxDays = utc().subtract(days, 'days').toDate();
  const repository = new WorksheetRepository();
  const queryBuilder = repository.getQueryBuilder()
    .where('inFreezer = ?', true)
    .where('statusChangedAt <= ?', maxDays)
    .where(`status IN ${JSON.stringify([WorkSheetStatus.NO_SALE, WorkSheetStatus.MEETING])}`)
    .limit(100);

  if (provinces.length > 0) {
    queryBuilder.where(`buildingAddress.province IN ${JSON.stringify(provinces)}`);
  }

  const worksheets = await repository.query(queryBuilder);
  return pullOutFreezer(worksheets);
}

export async function moveNoSaleWorksheets({days, provinces}) {
  const maxDays = utc().subtract(days, 'days').toDate();
  const repository = new WorksheetRepository();
  const queryBuilder = repository.getQueryBuilder()
    .where('status = ?', WorkSheetStatus.NO_SALE)
    .where('statusChangedAt <= ?', maxDays)
    .limit(100);

  if (provinces.length > 0) {
    queryBuilder.where(`buildingAddress.province IN ${JSON.stringify(provinces)}`);
  }

  const worksheets = await repository.query(queryBuilder);
  return pullOutFreezer(worksheets);
}

async function pullOutFreezer(worksheets) {
  if (!worksheets || worksheets.length === 0) {
    return;
  }

  const repository = new WorksheetRepository();
  const updatedWorksheets = worksheets.map(worksheet => {
    debugFreezer(`moving out freezer worksheet '${worksheet.id}', last status changed at: '${worksheet.statusChangedAt}'`);
    return fromJSON(worksheet, Worksheet).pullOutFreezer(WorkSheetStatus.WITH_OWNER);
  });

  if (updatedWorksheets.length === 0) {
    return;
  }

  const saveWorksheet = async(worksheet) => {
    await repository.save(worksheet, false);
    await moveOwnerStatus(worksheet.relatedBuildingIds[0]);
  };

  await Promise.map(updatedWorksheets, saveWorksheet, {concurrency: 1});
}

export async function moveOwnerStatus(buildingId) {
  const repository = new OwnerRepository();
  const owners = await repository.findOwnersByBuildingId(buildingId);
  if (owners.length === 0) {
    debugFreezer('there is not owners for this worksheet to change');
    return;
  }

  const businessToRemove = [];

  const updatedOwners = owners.map(owner => {
    const toState = owner.status === OwnerStatus.NO_SALE ? OwnerStatus.VERIFIED : owner.status;
    debugFreezer(`moving owner ${owner.id} with current status ${owner.status} to ${toState}`);
    if (owner.business) {
      businessToRemove.push({businessId: owner.business.meetingWithOperatorId, buildingId: owner.buildingId});
    }

    return owner.pullOutFreezer(OwnerStatus.VERIFIED);
  });

  const saveOwner = owner => repository.save(owner, false);
  const cleanBusiness = ({buildingId, businessId}) => removeBuildingFromBusiness(buildingId, businessId);
  if (updatedOwners.length > 0) {
    await Promise.map(updatedOwners, saveOwner, {concurrency: 3});
  }

  if (businessToRemove.length > 0) {
    await Promise.map(businessToRemove, cleanBusiness, {concurrency: 2});
  }
}

import _ from 'lodash';
import couchbase from '../src/db/couchbase';
import {WorksheetRepository} from '../src/worksheet/models/worksheet';
import _every from 'lodash/every';
import {isInvalid, publicEntityNotVerify} from '../src/types/owner';
import {WorkSheetStatus} from '../src/types/worksheet';
import _some from 'lodash/some';

async function init() {
  await couchbase();
  await invalidate();
}

export async function invalidate() {
  const worksheetRepo = new WorksheetRepository();
  const worksheets = await worksheetRepo.query();

  await Promise.map(worksheets, async(worksheet) => {
    try {
      await calculateInvalidWorksheet(worksheet);
    } catch (e) {
      console.log('calculate new status ', worksheet.id, e);
    }
  });
}

async function calculateInvalidWorksheet(worksheet) {
  const worksheetRepo = new WorksheetRepository();
  const workseetComplete = worksheetRepo.findByIdWIthIncludes(worksheet.id);
  const newStatus = calculateNewStatus(workseetComplete);
  const updatedWorksheet = worksheet.setStatus(newStatus);
  await worksheetRepo.save(updatedWorksheet);
}

function calculateNewStatus(worksheet) {
  const isValidLength = worksheet.relatedOwners.length > 0;
  const everyInvalidOwner = isValidLength && _every(worksheet.relatedOwners, isInvalid);
  const isPublicEntity = isValidLength && _some(worksheet.relatedOwners, publicEntityNotVerify);

  if (everyInvalidOwner) {
    return WorkSheetStatus.INVALID;
  }

  if (isPublicEntity) {
    return WorkSheetStatus.PUBLIC;
  }

  return worksheet.status;
}

if (require.main === module) {
  init()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

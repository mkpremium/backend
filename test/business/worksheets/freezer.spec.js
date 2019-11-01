import {Worksheet, WorkSheetStatus} from '../../../src/types/worksheet';
import {deleteAll} from '../../common';
import {WorksheetRepository} from '../../../src/worksheet/models/worksheet';
import {moveWorksheetOutOfFreezer} from '../../../src/business/worksheets/freezer';

import {expect} from 'chai';
import {utc} from '../../../src/lib/date';

describe('moveWorksheetOutOfFreezer', () => {
  let workSheetRepository = new WorksheetRepository();

  async function countWorksheetStatus() {
    const queryBuilder = workSheetRepository
      .getQueryBuilder('count')
      .where('status = ? ', WorkSheetStatus.NO_SALE);

    return workSheetRepository.countQuery(queryBuilder);
  }

  before(async() => {
    await deleteAll();
    const worksheetDate = utc().subtract(90, 'days').toDate();
    const worksheet = Worksheet({status: WorkSheetStatus.NO_SALE, statusChangedAt: worksheetDate});
    await workSheetRepository.save(worksheet, false);
  });

  it('should change to a state after 90 days', async() => {
    const resultBefore = await countWorksheetStatus();
    expect(resultBefore).to.equal(1);
    await moveWorksheetOutOfFreezer();
    const result = await countWorksheetStatus();
    expect(result).to.equal(0);
  });

  it('should not change to a new state before 90 days');
});

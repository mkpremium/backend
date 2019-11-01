import {Worksheet, WorkSheetStatus} from '../../../src/types/worksheet';
import {expect} from 'chai';

describe('Worksheet.setStatus', () => {
  it('default last updated should be null', () => {
    const testWorksheet = Worksheet({});
    expect(testWorksheet.statusChangedAt).to.be.undefined();
  });

  it('should change the last updated date after a status changed', () => {
    const testWorksheet = Worksheet({status: WorkSheetStatus.DEFAULT});
    const invalidWorksheet = testWorksheet.setStatus(WorkSheetStatus.INVALID);
    expect(invalidWorksheet.statusChangedAt).to.not.be.undefined();
  });

  it('last updated should not be updated after the same status was assigned', () => {
    const testWorksheet = Worksheet({});
    const invalidWorksheet = testWorksheet.setStatus(testWorksheet.status);
    expect(invalidWorksheet.statusChangedAt).to.be.equal(testWorksheet.statusChangedAt);
  });
});

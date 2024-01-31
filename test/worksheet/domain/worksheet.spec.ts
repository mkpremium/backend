import { releaseWorksheet, WorkSheetStatus, WorksheetStatusType } from '../../../src/worksheet/domain/worksheet'
import { expect } from 'chai'
import { worksheetBuilder } from '../worksheet.builder'

describe('releaseWorksheet', () => {
  it('changes status to LOOKING_MEETING when worksheet is OPEN', () => {
    expect(releaseWorksheet(worksheetBuilder({ status: 'OPEN' }).build()).status)
      .to.be.eql(WorkSheetStatus.AVAILABLE)
  })

  it('changes status to LOOKING_MEETING when worksheet is TAKEN', () => {
    expect(releaseWorksheet(worksheetBuilder({ status: 'TAKEN' }).build()).status)
      .to.be.eql(WorkSheetStatus.AVAILABLE)
  });

  [
    WorkSheetStatus.NO_SALE,
    WorkSheetStatus.AVAILABLE,
    WorkSheetStatus.INVALID,
    WorkSheetStatus.NO_SALE,
    WorkSheetStatus.ALREADY_SOLD,
    WorkSheetStatus.MEETING,
    WorkSheetStatus.PUBLIC
  ].forEach((finalStatus: WorksheetStatusType) =>
    it(`does not change final status(${finalStatus})`, () => {
      expect(releaseWorksheet(worksheetBuilder({ status: finalStatus }).build()).status)
        .to.be.eql(finalStatus)
    })
  )
})

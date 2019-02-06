import {
  deleteAll
} from '../../common';
import WorksheetHelper from '../../helpers/worksheet';
import {WorksheetRepository} from "../../../src/worksheet/models/worksheet";

describe('search worksheets', () => {
  let worksheets;
  before(async() => {
    await deleteAll();
    
    worksheets = await WorksheetHelper.createWorksheetsWithBuildingsAssociated();
  });
  describe('search worksheets by address', () => {
    it('able to search worksheets by building address', async() => {
      const worksheetRepository = new WorksheetRepository();
      const result = await worksheetRepository.searchWorksheets({keyword: 'b*'});
  
      result.results.should.be.a('array');
    });
  });
});

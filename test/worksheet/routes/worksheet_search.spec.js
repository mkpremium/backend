import app from '../../../src/app';
import {
  deleteAll,
  operatorCreateManager,
  operatorLogin,
  defaultPassword
} from '../../common';
import WorksheetHelper from '../../helpers/worksheet';

describe('search worksheets', () => {
  let authenticatedManager;
  let manager;
  let worksheets;
  beforeEach(async() => {
    await deleteAll();
    manager = await operatorCreateManager();
    authenticatedManager = await operatorLogin(app, {username: manager.username, password: defaultPassword});
    
    worksheets = await WorksheetHelper.createWorksheetsWithBuildingsAssociated();

  });
  describe('search worksheets by address', () => {
    it('able to search worksheets by building address', async() => {
      // We know there are buildings in Barcelona
      const response = await WorksheetHelper.searchWorksheetEndpoint(authenticatedManager, {keyword: 'b*'});
      console.log('response', JSON.stringify(response));
      response.results.should.be.a('array');
    });
  });
});

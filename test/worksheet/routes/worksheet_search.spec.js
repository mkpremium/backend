import app from '../../../src/app';
import {defaultPassword, deleteAll, operatorCreateManager, operatorLogin} from '../../common';
import WorksheetHelper from '../../helpers/worksheet';

describe('Route search worksheets', () => {
  let authenticatedManager;
  let manager;
  beforeEach(async() => {
    await deleteAll();
    manager = await operatorCreateManager();
    authenticatedManager = await operatorLogin(app, {username: manager.username, password: defaultPassword});

    await WorksheetHelper.createWorksheetsWithBuildingsAssociated();
  });
  describe('search worksheets by address', () => {
    it('able to search worksheets by building address', async() => {
      // We know there are buildings in Barcelona
      const response = await WorksheetHelper.searchWorksheetEndpoint(authenticatedManager, {query: 'b*'});
      response.results.should.be.a('array');
      response.results.length.should.not.equal(0);
    });
  });
});

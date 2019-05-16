import {WorksheetRepository} from '../../../src/worksheet/models/worksheet';
import app from '../../../src/app';
import {deleteAll, operatorCreate, operatorCreateManager, operatorLogin} from '../../common';
import WorksheetHelper, {CreateWorksheetType} from '../../helpers/worksheet';
import OwnerHelper from '../../helpers/owner';
import _ from 'lodash';
import {OwnerStatus} from '../../../src/types/enums';
import {WorkSheetStatus} from '../../../src/types/worksheet';
import {WorksheetQueueRepository} from '../../../src/worksheet/models/queue';
import {doActionInQueueEndpoint} from '../../helpers/queue';

describe('WorksheetRepository', () => {
  describe('Worksheet find by source', () => {
    it('findBySource', async() => {
      const repo = new WorksheetRepository();
      await repo.findBySource({source: {city: 'BARCELONA'}});
    });
  });

  describe('Test worksheet status changes from DEFAULT to PUBLIC', () => {
    let authenticatedOperator, authenticatedManager, worksheetsWithOwner, queue;
    before(async() => {
      await deleteAll();
      queue = await createQueue();
      await operatorCreate('', queue.id);
      await operatorCreateManager();
      authenticatedOperator = await operatorLogin(app, {username: 'operator', password: 'Passw0rd'});
      authenticatedManager = await operatorLogin(app, {username: 'manager', password: 'Passw0rd'});

      worksheetsWithOwner = await WorksheetHelper.createWorksheetsAndOwnerWithBuilding(authenticatedManager);
    });

    it('Test update worksheet status', async() => {
      const worksheetAndOwner = _.first(worksheetsWithOwner);
      const worksheet = worksheetAndOwner.worksheet;
      const owner = worksheetAndOwner.owner;
      const ownerPayload = {
        status: OwnerStatus.PUBLIC,
        verified: true
      };

      // change owner status
      await OwnerHelper.updateOwnerViaEndpoint(owner.id, ownerPayload, authenticatedOperator);
      const updated = await OwnerHelper.findOwner(owner.id);
      updated.status.should.be.equal(OwnerStatus.PUBLIC);

      // calculate worksheet status
      const worksheetUpdated = await WorksheetHelper
        .updateStatusViaModel(worksheet.id, authenticatedOperator.operator.id);
      worksheetUpdated.status.should.be.equal(WorkSheetStatus.PUBLIC);
    });

    it('no available items on the queue', async() => {
      await doActionInQueueEndpoint(authenticatedOperator, queue.id, null, 422);
    });
  });

  describe('Test worksheet status changes from DEFAULT, WITH_OWNER to PUBLIC', () => {
    let authenticatedOperator, authenticatedManager, worksheetsWithOwner, queue;
    before(async() => {
      await deleteAll();
      queue = await createQueue();
      await operatorCreate('', queue.id);
      await operatorCreateManager();
      authenticatedOperator = await operatorLogin(app, {username: 'operator', password: 'Passw0rd'});
      authenticatedManager = await operatorLogin(app, {username: 'manager', password: 'Passw0rd'});

      worksheetsWithOwner = await WorksheetHelper.createWorksheetsAndOwnerWithBuilding(authenticatedManager);
    });

    it('Test update worksheet status', async() => {
      const worksheetAndOwner = _.first(worksheetsWithOwner);
      const worksheet = worksheetAndOwner.worksheet;
      const owner = worksheetAndOwner.owner;

      // 1. Verify owner
      const verifyOwnerPayload = {
        status: OwnerStatus.VERIFIED,
        verified: true
      };
      await OwnerHelper.updateOwnerViaEndpoint(owner.id, verifyOwnerPayload, authenticatedOperator);
      const updated = await OwnerHelper.findOwner(owner.id);
      updated.status.should.be.equal(OwnerStatus.VERIFIED);

      // calculate worksheet status
      const worksheetUpdated = await WorksheetHelper
        .updateStatusViaModel(worksheet.id, authenticatedOperator.operator.id);
      worksheetUpdated.status.should.be.equal(WorkSheetStatus.WITH_OWNER);

      // 2. Mark as Public
      const publicOwnerPayload = {
        status: OwnerStatus.PUBLIC,
        verified: true
      };
      await OwnerHelper.updateOwnerViaEndpoint(owner.id, publicOwnerPayload, authenticatedOperator);
      const publicOwner = await OwnerHelper.findOwner(owner.id);
      publicOwner.status.should.be.equal(OwnerStatus.PUBLIC);

      // calculate worksheet status
      const worksheetPublicUpdated = await WorksheetHelper
        .updateStatusViaModel(worksheet.id, authenticatedOperator.operator.id);
      worksheetPublicUpdated.status.should.be.equal(WorkSheetStatus.PUBLIC);
    });

    it('no available items on the queue', async() => {
      await doActionInQueueEndpoint(authenticatedOperator, queue.id, null, 422);
    });
  });

  describe('Update status for invalid Worksheets', () => {
    let authenticatedOperator, authenticatedManager, worksheetsNoContacts, worksheetsBadContacts, queue;
    before(async() => {
      await deleteAll();
      queue = await createQueue();
      await operatorCreate('', queue.id);
      await operatorCreateManager();
      authenticatedOperator = await operatorLogin(app, {username: 'operator', password: 'Passw0rd'});
      authenticatedManager = await operatorLogin(app, {username: 'manager', password: 'Passw0rd'});

      worksheetsNoContacts = await WorksheetHelper
        .createWorksheetsAndOwnerWithBuilding(authenticatedManager, CreateWorksheetType.INVALID_NO_CONTACTS);
      worksheetsBadContacts = await WorksheetHelper
        .createWorksheetsAndOwnerWithBuilding(authenticatedManager, CreateWorksheetType.INVALID_BAD_CONTACTS);
    });

    it('Test update status with worksheet without contacts', async() => {
      const worksheetAndOwner = _.first(worksheetsNoContacts);
      const worksheet = worksheetAndOwner.worksheet;

      // calculate worksheet status
      const worksheetUpdated = await WorksheetHelper
        .updateStatusViaModel(worksheet.id, authenticatedOperator.operator.id);
      worksheetUpdated.status.should.be.equal(WorkSheetStatus.INVALID);
    });

    it('Test update status with worksheet with bad contacts, no operator confirm', async() => {
      const worksheetAndOwner = _.first(worksheetsBadContacts);
      const worksheet = worksheetAndOwner.worksheet;

      // calculate worksheet status
      const worksheetUpdated = await WorksheetHelper
        .updateStatusViaModel(worksheet.id, authenticatedOperator.operator.id);
      worksheetUpdated.status.should.be.equal(WorkSheetStatus.DEFAULT);
    });

    it('Test update status with worksheet with bad contacts, operator confirmed', async() => {
      const worksheetAndOwner = _.first(worksheetsBadContacts);
      const {worksheet, owner} = worksheetAndOwner;

      // Confirm
      const payload = {
        verified: true
      };
      await OwnerHelper.updateOwnerViaEndpoint(owner.id, payload, authenticatedOperator);

      // calculate worksheet status
      const worksheetUpdated = await WorksheetHelper
        .updateStatusViaModel(worksheet.id, authenticatedOperator.operator.id);
      worksheetUpdated.status.should.be.equal(WorkSheetStatus.INVALID);
    });
  });
});

async function createQueue() {
  const repo = new WorksheetQueueRepository();
  return repo.save({
    name: 'test'
  }, false);
}

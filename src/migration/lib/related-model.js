import t from 'tcomb';
import Promise from 'bluebird';
import _uniq from 'lodash/uniq';

import {WorksheetRepository} from '../../worksheet/models/worksheet';
import {BuildingRepository} from '../../building/models';
import {OwnerRepository} from '../../owner/models';
import {MigrateModelV2} from './migrate-model-v2';

export class RelatedModel extends MigrateModelV2 {
  constructor(filename, app = {}) {
    super('related', filename, app);
  }

  async pushToDatabase(record) {
    const worksheetRepo = new WorksheetRepository();
    const buildingRepo = new BuildingRepository();
    const ownerRepo = new OwnerRepository();

    try {
      const {worksheets, buildings, owners} = await Promise.props({
        worksheets: worksheetRepo.findByMigratedId(record.worksheetId),
        buildings: buildingRepo.findByMigratedId(record.buildingId),
        owners: ownerRepo.findByMigratedId(record.ownerId)
      });

      const [worksheet] = worksheets;
      const [building] = buildings;
      const [owner] = owners;

      console.log('related-mode', 'before', record.worksheetId, worksheet.id, worksheet.relatedBuildingIds, 'Owners', worksheet.relatedOwnerIds);

      const updatedWorksheet = t.update(worksheet, {
        relatedBuildingIds: {
          $set: _uniq(worksheet.relatedBuildingIds.concat([building.id]))
        },
        relatedOwnerIds: {
          $set: _uniq(worksheet.relatedOwnerIds.concat([owner.id]))
        }
      });
      const updatedOwner = t.update(owner, {
        buildingId: {
          $set: building.id
        },
        verified: {
          $set: record.verified
        }
      });

      console.log('related-mode', 'after', record.worksheetId, worksheet.id, updatedWorksheet.relatedBuildingIds, 'Owners', updatedWorksheet.relatedOwnerIds);

      await Promise.all([
        worksheetRepo.save(updatedWorksheet, false),
        ownerRepo.save(updatedOwner, false)
      ]);
    } catch (e) {
      console.error('record', record);
      throw e;
    }
  }
}

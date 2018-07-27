import t from 'tcomb';
import Promise from 'bluebird';
import _uniq from 'lodash/uniq';

import {MigrateModel} from './migrate-model';
import {WorksheetRepository} from '../../worksheet/models/worksheet';
import {BuildingRepository} from '../../building/models';
import {OwnerRepository} from '../../owner/models';

export class RelatedModel extends MigrateModel {
  constructor(filename, app = {}) {
    super('related', filename, app);
  }

  async pushToDatabaseRecord(record) {
    const worksheetRepo = new WorksheetRepository();
    const buildingRepo = new BuildingRepository();
    const ownerRepo = new OwnerRepository();

    try {
      const [worksheet] = await worksheetRepo.findByMigratedId(record.worksheetId);
      const [building] = await buildingRepo.findByMigratedId(record.buildingId);
      const [owner] = await ownerRepo.findByMigratedId(record.ownerId);

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

      if (updatedWorksheet.relatedBuildingIds.length === 0) {
        console.log('RELATED', record);
      }

      await Promise.all([
        worksheetRepo.save(updatedWorksheet, false),
        ownerRepo.save(updatedOwner, false)
      ]);
    } catch (e) {
      console.error('record', record);
      throw e;
    }
  }

  async pushToDatabase(processedData) {
    return Promise.mapSeries(processedData, this.pushToDatabaseRecord);
  }
}

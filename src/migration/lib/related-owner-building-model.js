import Promise from 'bluebird';
import t from 'tcomb';

import {WorksheetRepository} from '../../worksheet/models/worksheet';
import {BuildingRepository} from '../../building/models';
import {OwnerRepository} from '../../owner/models';
import _uniq from 'lodash/uniq';
import {MigrateModelV2} from './migrate-model-v2';

export class RelatedOwnerBuildingModel extends MigrateModelV2 {
  constructor(filename, app = {}) {
    super('related', filename, app);
  }

  async pushToDatabase(record) {
    const buildingRepo = new BuildingRepository();
    const worksheetRepo = new WorksheetRepository();
    const ownerRepo = new OwnerRepository();

    try {
      const [building] = await buildingRepo.findByMigratedId(record.buildingId);
      const [owner] = await ownerRepo.findByMigratedId(record.ownerId);
      const [worksheet] = await worksheetRepo.findByMigratedId(record.worksheetId);

      if (!building) {
        console.log('OMITED', 'building doesnt exists', record);
        return;
      }

      if (!owner) {
        console.log('OMITED', 'owner doesnt exists', record);
      }

      if (!worksheet) {
        console.log('OMITED', 'worksheet doesnt exists', record);
      }

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
        }
      });

      console.log('RECORD', 'record it was related', record);

      await Promise.all([
        worksheetRepo.save(updatedWorksheet, false),
        ownerRepo.save(updatedOwner, false)
      ]);
    } catch (e) {
      console.error('ERROR ON RECORD', record);
      throw e;
    }
  }
}

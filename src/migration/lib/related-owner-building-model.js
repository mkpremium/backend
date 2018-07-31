import _find from 'lodash/find';
import Promise from 'bluebird';
import t from 'tcomb';

import {MigrateModel} from './migrate-model';
import {WorksheetRepository} from '../../worksheet/models/worksheet';
import {BuildingRepository} from '../../building/models';
import {OwnerRepository} from '../../owner/models';
import _uniq from 'lodash/uniq';

export class RelatedOwnerBuildingModel extends MigrateModel {
  constructor(filename, app = {}) {
    super('related', filename, app);
  }

  async pushToDatabaseRecord(records, emptyWorksheet) {
    const record = _find(records, {worksheetId: emptyWorksheet._migrateId});
    if (!record) {
      return;
    }

    let omited = false;

    const buildingRepo = new BuildingRepository();
    const worksheetRepo = new WorksheetRepository();
    const ownerRepo = new OwnerRepository();

    const [building] = await buildingRepo.findByMigratedId(record.buildingId);
    if (building) {
      const worksheetByBuilding = await worksheetRepo.findWorksheetByBuilding(building.id);

      if (worksheetByBuilding) {
        console.log('OMITED', 'building found in another worksheet', record);
        omited = true;
      }
    } else {
      console.log('OMITED', 'building doesnt exists', record);
      omited = true;
    }

    const [owner] = await ownerRepo.findByMigratedId(record.ownerId);
    if (owner) {
      const worksheetByOwner = await worksheetRepo.findWorksheetByOwner(owner.id);

      if (worksheetByOwner) {
        console.log('OMITED', 'owner found in another worksheet', record);
        omited = true;
      }
    } else {
      console.log('OMITED', 'owner doesnt exists', record);
      omited = true;
    }

    if (!omited) {
      const updatedWorksheet = t.update(emptyWorksheet, {
        relatedBuildingIds: {
          $set: _uniq(emptyWorksheet.relatedBuildingIds.concat([building.id]))
        },
        relatedOwnerIds: {
          $set: _uniq(emptyWorksheet.relatedOwnerIds.concat([owner.id]))
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
    }
  }

  async pushToDatabase(processedData) {
    const worksheetRepo = new WorksheetRepository();
    const emptyWorksheets = await worksheetRepo.findEmptyWorksheets();

    return Promise
      .mapSeries(emptyWorksheets, (emptyWorksheet) => this.pushToDatabaseRecord(processedData, emptyWorksheet));
  }
}

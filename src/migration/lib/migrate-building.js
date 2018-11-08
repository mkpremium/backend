import _ from 'lodash';
import t from 'tcomb';
import uuid from 'uuid/v4';
import {MigrateModelV2} from './migrate-model-v2';
import models from '../models';
import {OwnerRepository} from '../../owner/models';

async function findOwners(building) {
  const repo = new OwnerRepository();
  const qb = repo.getQueryBuilder().where('_relatedTo = ?', building.owner.name);
  return repo.query(qb);
}

export class MigrateBuildings extends MigrateModelV2 {
  constructor(filename, app = {}) {
    super('building', filename, app);
  }

  async processFunc(data, row) {
    try {
      const building = models.building(data);

      const owners = await findOwners(building);
      const ownerIds = _.map(owners, 'id');

      const worksheet = t.WorkSheet({
        id: uuid(),
        _relatedTo: building.owner.name,
        relatedBuildingIds: [building.id],
        relatedOwnerIds: ownerIds,
        buildingAddress: building.address
      });

      await Promise.all([
        this.pushToDatabase(building),
        this.pushToDatabase(worksheet)
      ]);
    } catch (e) {
      console.error(e.message, 'at', row, data);
      throw e;
    }
  }
}

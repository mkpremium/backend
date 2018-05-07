import Promise from 'bluebird';
import _flatten from 'lodash/flatten';
import _times from 'lodash/times';
import _omit from 'lodash/omit';

import app from '../src/app';

import {WorksheetRepository} from '../src/worksheet/models/worksheet';
import {OwnerRepository} from '../src/owner/models';
import {BuildingRepository} from '../src/building/models';

async function init() {
  await app.locals.bucketPromise;
  const worksheetRepo = new WorksheetRepository();
  const ownerRepo = new OwnerRepository();
  const buildingRepo = new BuildingRepository();

  const worksheets = await worksheetRepo.query();
  const ownerIds = _flatten(worksheets.map(worksheet => worksheet.relatedOwnerIds));
  const owners = await ownerRepo.findByIdWithIncludes(ownerIds, ['person', 'building']);

  const buildings = await buildingRepo.query();

  const json = value => JSON.parse(JSON.stringify(value));
  const cleanIds = value => {
    delete value.person.id;
    value.person.contacts = value.person.contacts.map(contact => _omit(contact, ['id']));

    return value;
  };

  async function create(i) {
    const buildingsParams = _omit(json(buildings[i % buildings.length]), ['id']);
    const ownerParams = _omit(json(owners[i % owners.length]), ['id']);
    const owner = await ownerRepo.createOwnerAndPerson(cleanIds(ownerParams));
    const building = await buildingRepo.save(Object.assign(buildingsParams, {ownerId: owner.id}));
    const worksheetParams = {
      relatedOwnerIds: [owner.id],
      relatedBuildingIds: [building.id]
    };
    return worksheetRepo.save(worksheetParams);
  }

  await Promise.mapSeries(_times(1000), create);
}

init()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

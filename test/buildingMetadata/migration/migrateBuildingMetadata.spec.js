import {deleteAll} from '../../common';
import BuildingHelper from '../../helpers/building';
import _ from 'lodash';
import t from 'tcomb';
import {BuildingRepository} from '../../../src/building/models';
import {resolve} from 'path';
import {seed} from '../../../cli/lib/migrate-building-metadata';

describe('Migrate building metadata', () => {
  let building;
  beforeEach(async() => {
    await deleteAll();
  });
  describe('Migrate building metadata command', () => {
    it.skip('able to associate files with building and upload those to s3', async() => {
      const buildingRepository = new BuildingRepository();
      const buildings = await BuildingHelper.runBuildingSeedAndGetThemAll();
      building = _.first(buildings);

      // there are two files related to the building with migration id 4,
      // remember files have have the name of the migration id or the cadastre.reference
      const buildingToUpdate = t.update(building, {_migrateId: {$set: '4'}});
      building = await buildingRepository.save(buildingToUpdate, false);
      const directoryPath = resolve(__dirname, '../../fixtures/dummyMetadata/');
      await await seed(directoryPath);
      building = await buildingRepository.findByIdOrThrow(building.id);
      const metadata = building.metadata;
      metadata.length.should.equal(2);
    });
  });
});

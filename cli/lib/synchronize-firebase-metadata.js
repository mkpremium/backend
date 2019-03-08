import debug from 'debug';
import _ from 'lodash';
import Promise from 'bluebird';
import {BuildingRepository, MetadataRepository} from '../../src/building/models';
import {saveMetadataToFirebase} from "../../src/firebase/lib/business";

const debugMigrate = debug('app:migration:synchronize-metadata');

export async function synchronizeMetadataWithFirebase() {
  debugMigrate('---------------------------------------------\nStart process to synchronize metadata with firebase...');
  
  const buildingRepository = new BuildingRepository();
  const metadataRepository = new MetadataRepository();
  const buildingIds = await buildingRepository.getCityBuildingIds('BARCELONA');
  
  // this is for the couchbase limitation
  const buildingIdsClunks =  _.chunk(buildingIds, 1000);
  
  await Promise.map(buildingIdsClunks, async (buildingIds) => {
    
    const buildings = await buildingRepository.findBuildingsByIds(buildingIds);
  
    await Promise.map(buildings, async (building) => {
      const metadataArray = building.metadata;
    
      await Promise.map(metadataArray, async (metadataBuilding) => {
        if (metadataBuilding.id) {
          const metadata = await metadataRepository.findById(metadataBuilding.id);
          if (metadata) {
            await saveMetadataToFirebase(metadata);
          }
        }
      });
    });
  }, {concurrency: 1});
  
  debugMigrate('---------------------------------------------\nProcess ended.');
}

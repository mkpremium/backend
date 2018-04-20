import t from 'tcomb';
import debug from 'debug';
import _isNil from 'lodash/isNil';
import {fbInformadores} from './';
import {fromFirebaseStreetBuilding} from './lib/street';
import {ScheduledTaskRepository} from '../scheduledEvents/models';
import {ScheduleTaskType} from '../scheduledEvents/types';
import {OwnerRepository} from '../owner/models';
import {BuildingRepository} from '../building/models';

const debugBinFirebase = debug('app:bin:firebase');

export default function init() {
  const db = fbInformadores.database();

  db.ref('Edificios_Data').on('child_changed', listenStreetBuildingChanges);
}

function listenStreetBuildingChanges(snapshot) {
  const streetBuilding = snapshot.val();
  const state = streetBuilding.Id_Estado;
  debugBinFirebase('listenStreetBuildingChanges', streetBuilding.Id_Edificio, `state [${state}]`);
  processBuildingStreet(state, streetBuilding)
    .catch(err => {
      console.error(err);
    });
}

async function processBuildingStreet(state, streetBuilding) {
  if (shouldProcessBuildingState(state)) {
    if (shouldScheduleBuildingState(state)) {
      return scheduleUpdateBuilding(streetBuilding);
    } else {
      return updateBuildingFrom(streetBuilding);
    }
  }
}

async function scheduleUpdateBuilding(streetBuilding) {
  const {building} = fromFirebaseStreetBuilding(streetBuilding);
  const context = {id: building.id, Id_Estado: null};
  return ScheduledTaskRepository.scheduleNewTask('1 hour', ScheduleTaskType.UPDATE_BUILDING, context);
}

async function updateBuildingFrom(streetBuilding) {
  const ownerRepo = new OwnerRepository();
  const {building, owner} = fromFirebaseStreetBuilding(streetBuilding);
  const [foundOwner] = ownerRepo.findByBuildingWithIncludes(building.id);
  if (!foundOwner) {
    return createNewOwner(building, owner);
  } else {
    return updateBuildingOwner(foundOwner, building, owner);
  }
}

async function createNewOwner(building, owner) {
  throw w
}

async function updateBuildingOwner(foundOwner, building, owner) {
  const buildingRepo = new BuildingRepository();
  const updatedBuilding = t.update(foundOwner.building, {$merge: building});
  await buildingRepo.save(updatedBuilding);
}

function shouldProcessBuildingState(state) {
  return !_isNil(state);
}

function shouldScheduleBuildingState(state) {
  return state === '42';
}

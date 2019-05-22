#!/usr/bin/env babel-node
import _ from 'lodash';
import * as t from 'tcomb';
import Promise from 'bluebird';
import program from 'commander';
import {actionWrapper} from './lib';
import {BuildingRepository} from '../src/building/models';
import {WorksheetRepository} from '../src/worksheet/models/worksheet';

if (require.main === module) {
  program
    .arguments('')
    .version('0.0.1')
    .action(actionWrapper(main))
    .parse(process.argv);
}

async function main() {
  await formatAllBuildingAddresses();
}

export async function formatAllBuildingAddresses() {
  const repo = new BuildingRepository();
  const buildingIds = await repo.getBuildingIds();
  const options = {concurrency: 2};

  return Promise.map(buildingIds, formatByBuildingAddress, options);
}

async function formatByBuildingAddress(buildingId) {
  const building = await findBuildingById(buildingId);
  const updatedBuilding = buildingWithFormattedAddress(building);
  await saveBuilding(updatedBuilding);
  await updateWorksheet(updatedBuilding);
}

async function findBuildingById(buildingId) {
  const repo = new BuildingRepository();
  return repo.findByIdOrThrow(buildingId);
}

function buildingWithFormattedAddress(building) {
  const {address} = building;
  const fullAddress = [
    _.get(address, 'type', ''),
    _.get(address, 'street', ''),
    `${_.get(address, 'number', '')},`,
    _.get(address, 'city', '')
  ].join(' ');

  const updatedAddress = t.update(address, {fullAddress: {$set: fullAddress}});
  return t.update(building, {address: {$set: updatedAddress}});
}

async function saveBuilding(building) {
  const repo = new BuildingRepository();
  return repo.save(building, false);
}

async function updateWorksheet(building) {
  const repo = new WorksheetRepository();
  const worksheet = await WorksheetRepository.findByBuilding(building.id);
  const updatedWorksheet = t.update(worksheet, {buildingAddress: {$set: building.address}});
  await repo.save(updatedWorksheet, false);
}

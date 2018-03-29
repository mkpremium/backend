import {wrap} from 'express-promise-wrap';
import {BuildingRepository} from './models';
import {getPrivateUploadUrl} from '../aws';

async function addMetadataToBuilding(req, res) {
  const buildingRepo = new BuildingRepository();
  const buildingId = req.params.id;
  const building = await buildingRepo.findByIdOrThrow(buildingId);
  const bodyWithAuthor = Object.assign({}, req.body, {
    createdBy: req.user.id
  });
  const metadata = await buildingRepo.addMetadataToBuilding(building, bodyWithAuthor);
  res.status(201).json(metadata);
}

async function createMetadataUploadUrl(req, res) {
  const url = getPrivateUploadUrl('metadata', req.body);
  res.json({url});
}

export const addMetadataToBuildingController = wrap(addMetadataToBuilding);
export const createMetadataUploadUrlController = wrap(createMetadataUploadUrl);

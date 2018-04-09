import {wrap} from 'express-promise-wrap';
import {BuildingProposalRepository, BuildingRepository} from './models';
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

async function addNegotiationProposal(req, res) {
  const buildingRepo = new BuildingRepository();
  const buildingId = req.params.id;
  const building = await buildingRepo.findByIdOrThrow(buildingId);
  const proposal = buildingRepo.addNegotiationProposal(building, req.user.id, req.body);
  res.status(201).json(proposal);
}

async function updateNegotiationProposal(req, res) {
  const proposalRepo = new BuildingProposalRepository();
  const buildingRepo = new BuildingRepository();
  const proposalId = req.params.id;
  const proposal = await proposalRepo.findByIdOrThrow(proposalId);

  const updatedProposal = await buildingRepo.updateNegotiationProposal(proposal, req.user.id, req.body);
  res.status(200).json(updatedProposal);
}

export const addMetadataToBuildingController = wrap(addMetadataToBuilding);
export const createMetadataUploadUrlController = wrap(createMetadataUploadUrl);
export const addNegotiationProposalController = wrap(addNegotiationProposal);
export const updateNegotiationProposalController = wrap(updateNegotiationProposal);

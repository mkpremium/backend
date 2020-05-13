import { wrap } from 'express-promise-wrap'
import { BuildingProposalRepository, BuildingRepository } from './models'
import { getPrivateUploadUrl } from '../aws'
import { WorksheetRepository } from '../worksheet/models/worksheet'
import { OwnerRepository } from '../owner/models'
import { History } from '../history/models'

export function createListBuildingsController (listBuildingsService) {
  return async (req, res) => {
    if (req.query.id) {
      res.send(await listBuildingsService.buildingsOfId(req.query.id))
    } else if (req.query.allAssignedToMe !== undefined) {
      res.send(await listBuildingsService.buildingsAssignedTo(req.user.operator.id))
    } else {
      res.status(400).json({error: 'No id or allAssignedToMe provided'})
    }
  }
}

export function createListBuildingProposalsController (listBuildingProposalsService) {
  return async (req, res) => {
    res.send(await listBuildingProposalsService.forBuilding(req.params.buildingId))
  }
}

async function addMetadataToBuilding (req, res) {
  const buildingRepo = new BuildingRepository()
  const buildingId = req.params.id
  const building = await buildingRepo.findByIdOrThrow(buildingId)
  const bodyWithAuthor = Object.assign({}, req.body, {
    createdBy: req.user.id
  })
  const metadata = await buildingRepo.addMetadataToBuilding(building, bodyWithAuthor)
  res.status(201).json(metadata)
}

async function createMetadataUploadUrl (req, res) {
  const url = getPrivateUploadUrl('metadata', req.body)
  res.json({ url })
}

async function addNegotiationProposal (req, res) {
  const buildingRepo = new BuildingRepository()
  const buildingId = req.params.id
  const building = await buildingRepo.findByIdOrThrow(buildingId)
  const proposal = await buildingRepo.addNegotiationProposal(building, req.user.id, req.body)
  res.status(201).json(proposal)
}

async function updateNegotiationProposal (req, res) {
  const proposalRepo = new BuildingProposalRepository()
  const buildingRepo = new BuildingRepository()
  const proposalId = req.params.id
  const proposal = await proposalRepo.findByIdOrThrow(proposalId)

  const updatedProposal = await buildingRepo.updateNegotiationProposal(proposal, req.user.id, req.body)
  res.status(200).json(updatedProposal)
}

async function addEntity (req, res) {
  const buildingRepo = new BuildingRepository()
  const buildingId = req.params.id
  const building = await buildingRepo.findByIdOrThrow(buildingId)
  const entity = await buildingRepo.addEntity(building, req.body)
  res.status(201).json(entity)
}

async function removeEntity (req, res) {
  const buildingRepo = new BuildingRepository()
  const buildingId = req.params.id
  const entityId = req.params.entityId
  const building = await buildingRepo.findByIdOrThrow(buildingId)
  await buildingRepo.removeEntity(building, entityId)
  res.status(204).send()
}

async function updateEntity (req, res) {
  const buildingRepo = new BuildingRepository()
  const buildingId = req.params.id
  const { entityId } = req.params
  const building = await buildingRepo.findByIdOrThrow(buildingId)
  const entity = await buildingRepo.updateEntity(building, entityId, req.body)
  res.status(200).json(entity)
}

async function addOwnerToBuilding (req, res) {
  const worksheetRepo = new WorksheetRepository()
  const ownerRepo = new OwnerRepository()
  const worksheet = await worksheetRepo.findWorksheetByBuilding(req.params.id)
  const owner = await ownerRepo.createOwnerAndPerson(req.body)
  await worksheetRepo.addOwner(worksheet, owner)
  await History.registerCreate({ contextModel: owner, user: req.user })
  await History.registerUpdate({ contextModel: worksheet, user: req.user })
  await worksheetRepo.syncWorksheetFirebase(worksheet)
  res.status(201).json(owner)
}

export const addMetadataToBuildingController = wrap(addMetadataToBuilding)
export const createMetadataUploadUrlController = wrap(createMetadataUploadUrl)
export const addNegotiationProposalController = wrap(addNegotiationProposal)
export const updateNegotiationProposalController = wrap(updateNegotiationProposal)
export const addEntityController = wrap(addEntity)
export const updateEntityController = wrap(updateEntity)
export const removeEntityController = wrap(removeEntity)
export const addOwnerToBuildingController = wrap(addOwnerToBuilding)

export const createListVerifiedOwnersController = legacyOwnerRepository => {
  return async (req, res) => {
    const owners = await legacyOwnerRepository.findAllVerifiedOwnersByBuildingId(req.query.buildingId)
    const result = owners.map(o => ({
      id: o.id,
      name: o.person.name,
      contacts: (o.person.contacts || []).map(({id, status, type, value}) => ({id, status, type, value})),
      featuredContact: o.featuredContact
    }))

    res.json(result)
  }
}

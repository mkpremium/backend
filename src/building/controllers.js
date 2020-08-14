import { wrap } from 'express-promise-wrap'
import { getPrivateUploadUrl } from '../aws'
import { History } from '../history/models'
import { OwnerRepository } from '../owner/models'
import { OwnerBusinessStatus } from '../types/enums'
import { WorksheetRepository } from '../worksheet/models/worksheet'
import { BuildingProposalRepository, BuildingRepository } from './models'

export function createListBuildingsController (listBuildingsService) {
  return wrap(async (req, res) => {
    if (req.query.id) {
      res.send(await listBuildingsService.buildingsOfId(req.query.id))
    } else if (req.query.allAssignedToMe !== undefined) {
      res.send(await listBuildingsService.buildingsAssignedTo(req.user.operator.id))
    } else {
      res.status(400).json({ error: 'No id or allAssignedToMe provided' })
    }
  })
}

export function createListBuildingProposalsController (listBuildingProposalsService) {
  return wrap(async (req, res) => {
    res.send(await listBuildingProposalsService.forBuilding(req.params.buildingId))
  })
}

export function createUpdateBuildingNegotiationStatusController (updateBuildingNegotiationStatusService) {
  return wrap(async (req, res) => {
    await updateBuildingNegotiationStatusService.updateBuildingStatus(
      req.params.buildingId, req.body.status, req.user.id)
    res.json()
  })
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

export function createAddNegotiationProposalController (legacyBuildingRepository, updateBuildingNegotiationStatusService) {
  return async (req, res) => {
    const buildingId = req.params.id
    const building = await legacyBuildingRepository.findByIdOrThrow(buildingId)
    const proposal = await legacyBuildingRepository.addNegotiationProposal(building, req.user.id, req.body)
    await updateBuildingNegotiationStatusService.updateBuildingStatus(buildingId, OwnerBusinessStatus.PROPOSAL_SENT, req.user.id)

    res.status(201).json(proposal)
  }
}

async function updateNegotiationProposal (req, res) {
  const proposalRepo = new BuildingProposalRepository()
  const buildingRepo = new BuildingRepository()
  const proposalId = req.params.id
  const proposal = await proposalRepo.findByIdOrThrow(proposalId)

  const updatedProposal = await buildingRepo.updateNegotiationProposal(proposal, req.user.id, req.body)
  res.status(200).json(updatedProposal)
}

async function addOwnerToBuilding (req, res) {
  const worksheetRepo = new WorksheetRepository()
  const ownerRepo = new OwnerRepository()
  const worksheet = await worksheetRepo.findWorksheetByBuilding(req.params.id)
  const owner = await ownerRepo.createOwnerAndPerson(req.body)
  await worksheetRepo.addOwner(worksheet, owner)
  await History.registerCreate({ contextModel: owner, user: req.user })
  await History.registerUpdate({ contextModel: worksheet, user: req.user })
  res.status(201).json(owner)
}

export const createListVerifiedOwnersController = legacyOwnerRepository => {
  return wrap(async (req, res) => {
    const owners = await legacyOwnerRepository.findAllVerifiedOwnersByBuildingId(req.params.buildingId)
    const result = owners.map(o => ({
      id: o.id,
      name: o.person.name,
      contacts: (o.person.contacts || []).map(({ id, status, type, value }) => ({ id, status, type, value })),
      featuredContact: o.featuredContact
    }))

    res.json(result)
  })
}

/**
 * @param adminBuildingRepository AdminBuildingRepository
 */
export const createAllAgentsStockStatsController = adminBuildingRepository => {
  return wrap(async (req, res) => {
    res.json(await adminBuildingRepository.allAgentsStockStats())
  })
}

export const addMetadataToBuildingController = wrap(addMetadataToBuilding)
export const createMetadataUploadUrlController = wrap(createMetadataUploadUrl)
export const updateNegotiationProposalController = wrap(updateNegotiationProposal)
export const addOwnerToBuildingController = wrap(addOwnerToBuilding)

export const createSetBuildingSalePriceController = setBuildingSalePriceService => {
  return wrap(async (req, res) => {
    const updatedBuilding = await setBuildingSalePriceService.setBuildingSalePrice({
      buildingId: req.params.buildingId,
      salePrice: req.body.salePrice
    })
    res.send(updatedBuilding)
  })
}

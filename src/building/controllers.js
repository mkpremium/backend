import { wrap } from 'express-promise-wrap'
import { getPrivateUploadUrl } from '../aws'
import { History } from '../history/models'
import { OwnerRepository } from '../owner/models'

export function createListBuildingProposalsController (listBuildingProposalsService) {
  return wrap(async (req, res) => {
    res.send(await listBuildingProposalsService.forBuilding(req.params.buildingId))
  })
}

async function createMetadataUploadUrl (req, res) {
  const url = getPrivateUploadUrl('metadata', req.body)
  res.json({ url })
}

export function createAddNegotiationProposalController ({
  addProposalForBuildingService
}) {
  return async (req, res) => {
    const buildingId = req.params.id
    const cmd = req.body
    const proposalId = await addProposalForBuildingService.add(buildingId, {
      amount: cmd.proposal,
      contactId: cmd.contactId,
      ownerId: cmd.ownerId,
      createdBy: req.user.id,
      message: cmd.message
    })

    res.status(201).json({ id: proposalId })
  }
}

export const createSignDocumentsUrlController = getDocumentsSignedURLService => {
  return wrap(async (req, res) => {
    const signedUrls = await getDocumentsSignedURLService.getDocumentsSignedURL(req.params.buildingId)
    res.json(signedUrls)
  })
}

export function createUpdateNegotiationProposalController ({ updateProposalService }) {
  return async function updateNegotiationProposal (req, res) {
    const proposalId = req.params.id

    await updateProposalService.updateProposal(proposalId, req.user.id, req.body)
    res.status(201)
  }
}

async function addOwnerToBuilding (req, res) {
  const ownerRepo = new OwnerRepository()
  const owner = await ownerRepo.createOwnerAndPerson(req.body)
  await History.registerCreate({ contextModel: owner, user: req.user })
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

export const createMetadataUploadUrlController = wrap(createMetadataUploadUrl)
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

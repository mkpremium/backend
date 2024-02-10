import { wrap } from 'express-promise-wrap'
import { OwnerRepository } from '../owner/repository/owner.repository'
import { ListBuildingProposalsService } from './service/list-building-proposals.service'

export function listBuildingProposalsControllerFactory (listBuildingProposalsService: ListBuildingProposalsService) {
  return wrap(async (req, res) => {
    res.send(await listBuildingProposalsService.forBuilding(req.params.buildingId))
  })
}

export function addNegotiationProposalControllerFactory ({
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

export const signDocumentsUrlControllerFactory = getDocumentsSignedURLService => {
  return wrap(async (req, res) => {
    const signedUrls = await getDocumentsSignedURLService.getDocumentsSignedURL(req.params.buildingId)
    res.json(signedUrls)
  })
}

export function updateNegotiationProposalControllerFactory ({ updateProposalService }) {
  return async function updateNegotiationProposal (req, res) {
    const proposalId = req.params.id

    await updateProposalService.updateProposal(proposalId, req.user.id, req.body)
    res.status(201)
  }
}

export function addOwnerToBuildingControllerFactory ({ addOwnerService }) {
  return async function (req, res) {
    const owner = await addOwnerService.addOwner(req.body, req.user)
    res.status(201).json(owner)
  }
}

export const listVerifiedOwnersControllerFactory = (ownersRepository: OwnerRepository) => {
  return wrap(async (req, res) => {
    // TODO: review owner props,
    const owners = await ownersRepository.verifiedOwnersOfBuildingWithId(req.params.buildingId)
    const result = owners.map(o => ({
      id: o.id,
      name: o.name,
      contacts: (o.contacts || []).map(({ id, status, type, value }) => ({ id, status, type, value })),
      featuredContact: o.featuredContact
    }))

    res.json(result)
  })
}

export const setBuildingSalePriceControllerFactory = setBuildingSalePriceService => {
  return wrap(async (req, res) => {
    const updatedBuilding = await setBuildingSalePriceService.setBuildingSalePrice({
      buildingId: req.params.buildingId,
      salePrice: req.body.salePrice
    })
    res.send(updatedBuilding)
  })
}

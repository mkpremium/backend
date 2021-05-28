import { Request, Response, } from 'express'
import { AddProposalForBuildingService } from '../service/add-proposal-for-building.service'

export const createAddProposalController = ({ addProposalForBuildingService }: { addProposalForBuildingService: AddProposalForBuildingService }) =>
  (req: Request & { user: { id: string } }, res: Response) => {
    const { ownerId, contactId, message, amount } = req.body
    return addProposalForBuildingService
      .add(req.params.buildingId, { ownerId, contactId, message, amount, createdBy: req.user.id })
      .then(() => {
        res.status(201).json()
      })
  }

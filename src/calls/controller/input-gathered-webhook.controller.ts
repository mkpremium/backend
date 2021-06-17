import { OwnerResponseProcessorService } from '../service/owner-response-processor.service'

export const createInputGatheredWebhookController = ({ ownerResponseProcessor }: { ownerResponseProcessor: OwnerResponseProcessorService, }) =>
  async (req, res) => {
    const { callId } = req.params
    const ownerResponse = req.body.Digits
    const { fromCity, buildingId } = req.query
    const response = ownerResponseProcessor.process({
        callId,
        ownerResponse,
        fromCity,
        buildingId,
    })

    res.send(response.toString())
  }

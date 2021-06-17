import { OwnerResponseProcessorService } from '../service/owner-response-processor.service'

export const createInputGatheredWebhookController = ({ ownerResponseProcessor }: { ownerResponseProcessor: OwnerResponseProcessorService, }) =>
  async (req, res) => {
    const { callId } = req.params
    const ownerResponse = req.body.Digits
    const { fromCity } = req.query
    const response = ownerResponseProcessor.process(callId, ownerResponse, fromCity)

    res.send(response.toString())
  }

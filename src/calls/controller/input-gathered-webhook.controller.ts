import { OwnerResponseProcessorService } from '../service/owner-response-processor.service'

export const createInputGatheredWebhookController = ({ ownerResponseProcessor }: { ownerResponseProcessor: OwnerResponseProcessorService, }) =>
  async (req, res) => {
    const { callId } = req.params
    const ownerResponse = req.body.Digits
    const { fromCity } = req.query
    return ownerResponseProcessor.process(callId, ownerResponse, fromCity)
      .then((response) => {
        res.send(response.toString())
      })
  }

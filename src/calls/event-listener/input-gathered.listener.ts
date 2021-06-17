import { InputGathered, OwnerResponse } from '../service/owner-response-processor.service'

export const createInputGatheredListener = () => async (evt: InputGathered) => {
  switch (evt.ownerResponse) {
    case OwnerResponse.SALE:
      // TODO create scheduled call
      break;
    case OwnerResponse.NO_SALE:
      // TODO save no sale
      break;
    case OwnerResponse.NOT_OWNER:
      // TODO delete owner
      break;
    default:
      // TODO log warning message?
  }
}

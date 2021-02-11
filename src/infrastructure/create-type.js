import t from 'tcomb'

export const createType = (type, getValidationErrorMessage, name) => {
  const Subtype = t.refinement(type, x => !t.String.is(getValidationErrorMessage(x)), name)
  Subtype.getValidationErrorMessage = getValidationErrorMessage
  return Subtype
}

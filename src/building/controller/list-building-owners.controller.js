/**
 * @param {OwnerRepository} legacyOwnerRepository
 * @return {function(*, *)}
 */
export const createListBuildingOwnersController = ({ legacyOwnersRepository }) => (req, res) => {
  res.sendStatus(501)
  return Promise.resolve()
}

export const createSearchOwnersController = (ownerRepository) => async (req, res) => {
  const phoneNumber = req.body.phoneNumber
  const foundOwners = await ownerRepository.findByPhoneNumber(phoneNumber)

  res.json(foundOwners)
}

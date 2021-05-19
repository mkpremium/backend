export const createSearchOwnersController = (ownersRepository) => async (req, res) => {
  const phoneNumber = req.body.phoneNumber
  const foundOwners = await ownersRepository.findByPhoneNumber(phoneNumber)

  res.json(foundOwners)
}

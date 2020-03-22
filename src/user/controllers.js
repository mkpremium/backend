export const createMeController = usersRepository => {
  return async (req, res) => {
    const user = await usersRepository.getUserOfId(req.user.operator.id)
    res.json({
      featuredOwners: user.featuredOwners ? user.featuredOwners : []
    })
  }
}

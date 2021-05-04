export const createStatusChangedController = ({ worksheetRepository }) => (req, res) => {
  return Promise.all(
    req.query.worksheetId.map(async worksheetId => {
      const worksheet = await worksheetRepository.get(worksheetId)
      return worksheetRepository.save(worksheet.statusChanged())
    })
  ).then(() => {
    res.status(200).json()
  })
}

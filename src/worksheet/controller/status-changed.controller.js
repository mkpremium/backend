import { setStatus } from '../domain/worksheet'

export const createStatusChangedController = ({ worksheetRepository }) => (req, res) => {
  const worksheetsId = typeof req.query.worksheetId === 'string'
    ? [req.query.worksheetId]
    : req.query.worksheetId

  return Promise.all(
    worksheetsId.map(async worksheetId => {
      const worksheet = await worksheetRepository.get(worksheetId)
      return worksheetRepository.save(setStatus(worksheet, worksheet.status, `requested by ${req.user.id}`))
    })
  ).then(() => {
    res.status(200).json()
  })
}

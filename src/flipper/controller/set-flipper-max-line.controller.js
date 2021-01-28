/**
 * @param {SetFlipperMaxLineService} setFlipperMaxLineService
 */
export const createSetFlipperMaxLineController = ({ setFlipperMaxLineService }) => (req, res) => {
  const { flipperId } = req.params
  const { maxLine } = req.body
  return setFlipperMaxLineService.setFlipperMaxLine(flipperId, maxLine)
    .then(() => {
      res.json()
    })
}

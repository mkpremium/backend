/**
 * @param {SetBuildingExpensesService} setBuildingExpensesService
 */
export const createSetBuildingExpensesController = ({ setBuildingExpensesService }) => (req, res) => {
  return setBuildingExpensesService.setTotalExpensesAmount(req.params.buildingId, req.body.total)
    .then(() => res.status(200).json())
}

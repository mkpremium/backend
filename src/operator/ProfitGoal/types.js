import t from 'tcomb'

export const ProfitGoalRequest = t.struct({
  operatorId: t.String,
  profitAmount: t.Number
}, 'ProfitGoalRequest')

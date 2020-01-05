import { fbComerciales } from '../../firebase'
import { madrid } from '../../lib/date'

export class ProfitGoalFirebaseRepository {
  constructor () {
    if (!fbComerciales.enabled) {
      return
    }
    this.db = fbComerciales.database()
  }

  async saveProfitGoalToFirebaseUser (profitGoal, operatorId) {
    if (!fbComerciales.enabled) {
      return
    }
    const profigGoalRef = this.getProfitGoalRoute(operatorId)
    const firebaseProfitGoal = this.toFirebaseProfitGoal(profitGoal)
    return profigGoalRef.set(firebaseProfitGoal)
  }

  getProfitGoalRoute (operatorId) {
    return this.db.ref(`${fbComerciales.prefixURL}Users/${operatorId}/ProfitGoal`)
  }

  toFirebaseProfitGoal (profitGoal) {
    return {
      amount: profitGoal.amount,
      updatedAt: madrid(profitGoal.updatedAt).unix()
    }
  }
}

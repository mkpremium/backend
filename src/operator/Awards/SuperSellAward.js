export class SuperSellAward {
  static hasSuperSellAward (profit) {
    return profit > 500000
  }

  static getSuperSellAward () {
    return 'SUPER_SELL'
  }
}

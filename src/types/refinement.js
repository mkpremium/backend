import t from 'tcomb'

export const Positive = t.refinement(t.union([t.Number, t.String]), n => parseFloat(n) >= 0, 'Positive')
export const StringSplitList = t.refinement(t.String, n => /,/.test(n), 'StringSplitList')

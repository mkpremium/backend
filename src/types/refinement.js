import t from 'tcomb'
import _isNil from 'lodash/isNil'

const passwordRegex = new RegExp('^(?=.*[A-Za-z])(?=.*\\d).{8,}$')

export const Positive = t.refinement(t.union([t.Number, t.String]), n => parseFloat(n) >= 0, 'Positive')
export const StringNotEmpty = t.refinement(t.String, n => !_isNil(n), 'StringNotEmpty')
export const StringSplitList = t.refinement(t.String, n => /,/.test(n), 'StringSplitList')
export const Password = t.Password = t.refinement(t.String, n => passwordRegex.test(n), 'Password')

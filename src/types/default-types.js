import t from 'tcomb'

/**
 * Turn Dates into real date
 * @param x
 * @return {Date}
 */
t.Date.fromJSON = function (x) {
  return isNaN(Date.parse(x)) ? x : new Date(x)
}

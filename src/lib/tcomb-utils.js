import t from 'tcomb'

/**
 * Helper to reduce the boilerplate to update inmutables t.list
 * @param list {t.list|Array}
 * @param currentItem {*}
 * @param newValues {*}
 * @return {*}
 */
export function updateList (list, currentItem, newValues) {
  const index = list.indexOf(currentItem)
  return t.update(list, { [index]: { $set: newValues } })
}

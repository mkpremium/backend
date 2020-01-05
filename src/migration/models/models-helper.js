/**
 * Remove invalid column names from CSV data
 * @param object
 * @return {{}}
 */
export function cleanObjectKeys (object) {
  const keys = Object.keys(object)
  const newObject = {}
  keys.forEach(key => {
    const newKey = key.toLowerCase()
      .trim()
      .replace(/\s/g, '_')
    newObject[newKey] = object[key]
  })

  return newObject
}

/**
 * Iterate over every object key and remove empty values
 * @param object
 * @return {{}}
 */
export function removeNullValues (object) {
  const keys = Object.keys(object)
  const newObject = {}
  keys.forEach(key => {
    newObject[key] = removeNullValue(object[key])
  })

  return newObject
}

export function cleanDataAndRemoveNullValues (object) {
  return removeNullValues(cleanObjectKeys(object))
}

/**
 * Values from CSV comes with many emptiness values NULL, null, --- this function
 * turn those values into a real null
 * @param value
 * @return {*}
 */
export function removeNullValue (value) {
  if (!value) {
    return null
  }

  if (/^[-]+$/.test(value)) {
    return null
  }

  if (value === '') {
    return null
  }

  if (value.toUpperCase() === 'NULL') {
    return null
  }

  return value
}

function cleanValue (value) {
  return value ? value.trim() : value
}

export function cleanValues (object) {
  const keys = Object.keys(object)
  const newObject = {}
  keys.forEach(key => {
    newObject[key] = cleanValue(object[key])
  })

  return newObject
}

/**
 * Remove invalid column names from CSV data
 * @param object
 * @return {{}}
 */
export function cleanObjectKeys(object) {
  const keys = Object.keys(object);
  const newObject = {};
  keys.forEach(key => {
    const newKey = key.toLowerCase().replace(' ', '_');
    newObject[newKey] = object[key];
  });

  return newObject;
}

/**
 * Iterate over every object key and remove empty values
 * @param object
 * @return {{}}
 */
export function removeNullValues(object) {
  const keys = Object.keys(object);
  const newObject = {};
  keys.forEach(key => {
    newObject[key] = removeNullValue(object[key]);
  });

  return newObject;
}

/**
 * Values from CSV comes with many emptiness values NULL, null, --- this function
 * turn those values into a real null
 * @param value
 * @return {*}
 */
function removeNullValue(value) {
  if (!value) {
    return null;
  }

  if (/^[-]+$/.test(value)) {
    return null;
  }

  if (value === '') {
    return null;
  }

  if (value.toUpperCase() === 'NULL') {
    return null;
  }

  return value;
}

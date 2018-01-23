export function cleanObjectKeys(object) {
  const keys = Object.keys(object);
  const newObject = {};
  keys.forEach(key => {
    const newKey = key.toLowerCase().replace(' ', '_');
    newObject[newKey] = object[key];
  });

  return newObject;
}

export function removeNullValues(object) {
  const keys = Object.keys(object);
  const newObject = {};
  keys.forEach(key => {
    newObject[key] = removeNullValue(object[key]);
  });

  return newObject;
}

function removeNullValue(value) {
  if (value === '') {
    return null;
  }

  if (value.toUpperCase() === 'NULL') {
    return null;
  }

  return value;
}

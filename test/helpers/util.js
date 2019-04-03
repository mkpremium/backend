/**
 *
 * @param description
 * @param value
 */
function prettyPrint(description, value) {
  console.log(description, JSON.stringify(value, null, 2));
}

module.exports = {
  prettyPrint
};

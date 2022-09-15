function upperFirst(word) {
  const [first, ...rest] = word
  return [first.toUpperCase(), ...rest].join('')
}

function toCamelCase(string) {
  return string
    .split('_')
    .map((word, index) => (index === 0 ? word : upperFirst(word)))
    .join('')
}

function camelCaseKeys(data) {
  return JSON.parse(JSON.stringify(data).replace(/"([a-z0-9_-]+)":/gim, toCamelCase))
}

module.exports = camelCaseKeys

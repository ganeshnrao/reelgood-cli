const { prompt } = require('enquirer')
const store = require('./store')
const logger = require('./logger')

async function setupConfigValue(path, message, initial) {
  const { value } = await prompt({ type: 'input', name: 'value', initial, message })
  store.set(path, value)
}

async function initializeConfig(reset = false) {
  const { apiUrl, apiKey } = store.get()
  if (!apiKey || !apiUrl || reset) {
    logger.log('This is a one-time setup.\nConfigurations will be saved in ~/reelgood.json\n')
    await setupConfigValue('apiUrl', 'Enter Reelgood API base URL', apiUrl || 'https://partner-api.reelgood.com/v1.0')
    await setupConfigValue('apiKey', 'Enter Reelgood API Key', apiKey || '')
  }
  return store.get()
}

module.exports = initializeConfig

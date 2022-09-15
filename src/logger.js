const isDebugMode = !!process.env.debug
const logger = Object.create(console)

if (!isDebugMode) {
  logger.debug = () => {}
}

module.exports = logger

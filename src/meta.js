const api = require('./api')

let serviceGroupById

async function initServices() {
  const services = await api.getMetaServices()
  serviceGroupById = services.reduce((acc, { id: serviceId, displayName: service, services: groups }) => {
    groups.forEach(({ groupId, accessType, displayName: group }) => {
      acc[groupId] = { service, group, serviceId, groupId, accessType }
    })
    return acc
  }, {})
}

function getServiceGroupName(groupId) {
  return serviceGroupById[groupId].service
}

module.exports = {
  initServices,
  getServiceGroupName,
}

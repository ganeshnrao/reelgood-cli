const axios = require('axios')
const camelCaseKeys = require('./camelCaseKeys')
const store = require('./store')
const logger = require('./logger')

const label = `[ api ]`

let api

function init() {
  const { apiUrl, apiKey } = store.get()
  api = axios.create({
    baseURL: `${apiUrl}`,
    timeout: 1000,
    headers: { 'x-api-key': apiKey },
  })
  api.interceptors.response.use(
    (response) => {
      const {
        data,
        status,
        config: { url, method },
      } = response
      logger.debug(`${label} ${method} ${url} ${status}`)
      return camelCaseKeys(data)
    },
    (error) => {
      if (!error.response) {
        throw error
      }
      const {
        response: {
          data: { message },
          status,
          config: { url, method },
        },
      } = error
      logger.error(`${label} ${method} ${url} ${status} ${message}`)
      throw new Error(`${status} ${message}`)
    }
  )
}

function hasExpired(cached, ttlDays) {
  if (cached.createdAtMs) {
    return Date.now() - cached.createdAtMs >= ttlDays * 24 * 60 * 60 * 1000
  }
  return true
}

async function getCached(storePath, uri, ttlDays = 5) {
  const cached = store.get(storePath)
  if (!cached || hasExpired(cached, ttlDays)) {
    const value = await api.get(uri)
    store.set(storePath, { createdAtMs: Date.now(), value })
  }
  const { value } = store.get(storePath)
  return value
}

function getMetaServices() {
  return getCached('meta.services', '/meta/services')
}

function getMetaGenres() {
  return getCached('meta.genres', '/meta/genres')
}

function getUsage() {
  return api.get('/usage')
}

function getContentBrowse(contentType) {
  return api.get(`/content/browse/${contentType}`)
}

function getContentSearch({ service, term, allServices, contentType }) {
  return api.get('/content/search', { params: { service, term, allServices, contentType } })
}

function getContentMovie(id) {
  return api.get(`/content/movie/${id}`)
}

function getContentShow(id) {
  return api.get(`/content/show/${id}`)
}

function getContentShowSeason(id, season) {
  return api.get(`/content/show/${id}/season/${season}`)
}

module.exports = {
  init,
  getMetaServices,
  getMetaGenres,
  getUsage,
  getContentBrowse,
  getContentSearch,
  getContentMovie,
  getContentShow,
  getContentShowSeason,
}

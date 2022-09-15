#!/usr/bin/env node

const { prompt } = require('enquirer')
const open = require('open')
const meta = require('./meta')
const api = require('./api')
const initializeConfig = require('./initializeConfig')
const logger = require('./logger')

const contentTypes = [
  { name: 'Any', value: 0 },
  { name: 'Show', value: 1 },
  { name: 'Movie', value: 2 },
]

function formatAvailability(availability) {
  return availability.map(({ serviceGroupId, links, purchaseCostHd, rentalCostHd }) => ({
    name: meta.getServiceGroupName(serviceGroupId),
    value: links.web,
    ...(purchaseCostHd || rentalCostHd ? { hint: `$${purchaseCostHd} Buy · $${rentalCostHd} Rent` } : {}),
  }))
}

async function inputSearchTerm() {
  const { term } = await prompt({
    type: 'input',
    name: 'term',
    message: 'Enter keywords',
  })
  return term
}

async function select({ message, choices }) {
  if (choices.length === 1) {
    logger.log(`${message}: ${choices[0].name} (only one choice)`)
    return choices[0].value
  }
  const { value } = await prompt({
    type: 'select',
    name: 'value',
    message,
    choices,
    result(choice) {
      return this.map(choice)[choice]
    },
  })
  return value
}

async function selectOne(searchResult) {
  const choices = searchResult.map(({ id, releasedOn, title, contentType }, index) => {
    const year = new Date(releasedOn).getFullYear()
    return {
      name: `[${index + 1}] ${title} (${year})`,
      value: { id, contentType },
      hint: contentType,
    }
  })
  if (!choices.length) {
    throw new Error('No items found')
  }
  return select({ message: 'Select', choices })
}

async function getMovieLink(id) {
  const { availability } = await api.getContentMovie(id)
  const choices = formatAvailability(availability)
  return select({ message: 'Where to watch?', choices })
}

async function getSeason(id) {
  const { seasonNumbers } = await api.getContentShow(id)
  const choices = seasonNumbers.map((seasonNumber) => ({ name: `Season ${seasonNumber}`, value: seasonNumber }))
  return select({ message: 'Which season?', choices })
}

async function getEpisode(id, season) {
  const episodes = await api.getContentShowSeason(id, season)
  const choices = episodes.map(({ availability, title, number, overview }) => ({
    name: `${number}. ${title}`,
    value: formatAvailability(availability),
    hint: overview,
  }))
  return select({ message: 'Which episode?', choices })
}

async function getEpisodeLink(id) {
  const season = await getSeason(id)
  const episode = await getEpisode(id, season)
  return select({ message: 'Where to watch?', choices: episode })
}

async function determineLinkAndOpenSelection({ id, contentType }) {
  const link = contentType === 'Movie' ? await getMovieLink(id) : await getEpisodeLink(id)
  logger.log(`  Opening ${link}`)
  open(link)
}

async function search() {
  const term = await inputSearchTerm()
  const searchResult = await api.getContentSearch({ term })
  const selection = await selectOne(searchResult)
  return determineLinkAndOpenSelection(selection)
}

async function getContentType() {
  return select({ message: 'Type?', choices: contentTypes })
}

async function browse() {
  const contentType = await getContentType()
  const searchResult = await api.getContentBrowse(contentType)
  const selection = await selectOne(searchResult)
  return determineLinkAndOpenSelection(selection)
}

async function config(reset = true) {
  const settings = await initializeConfig(reset)
  api.init(settings)
}

function exit() {
  logger.log('Goodbye!\n')
  process.exit(0)
}

const actions = [
  { name: 'Search for content by keywords', value: search, hint: 'Use this if you already have something in mind' },
  { name: 'Browse for content', value: browse, hint: 'Use this if you are not sure what you want to watch' },
  { name: 'Update configurations', value: config, hint: 'Use this to setup your Reelgood API and URL' },
  { name: 'Exit', value: exit },
]

async function main(clear) {
  try {
    if (clear) {
      logger.clear()
    }
    await config(false)
    await meta.initServices()
    logger.log('\nWelcome to Reelgood CLI!\nYou can hit Ctrl + C anytime to return to this menu\n')
    const action = await select({ message: 'What would you like to do?', choices: actions })
    await action()
    await main(false)
  } catch (error) {
    if (error.message) {
      logger.error(error.message)
      logger.debug(error.stack)
    }
    await main(!error.message)
  }
}

main(true)

const KnightlyBot = require('./knightlyBot.js')
require('dotenv').config()
const chalk = require('chalk')
const { createLogger, format, transports } = require('winston')
const { colorize, combine, printf } = format
const moment = require('moment')
const path = require('path')
const util = require('util')
const got = require('got')
const resolve = (str) => path.join('src', str)

const logFormat = printf((info) => {
  return `[${chalk.grey(moment().format('hh:mm:ss'))}] ${info.level}: ${info.message}`
})

const logger = createLogger({
  level: 'silly',
  format: combine(
    colorize(),
    logFormat
  ),
  transports: [new transports.Console()]
})

const knightly = new KnightlyBot({
  token: process.env.TOKEN,
  modules: resolve('modules'),
  disableEveryone: false,
  autoreconnect: true
})

knightly.unregister('middleware', true)
knightly.unregister('logger', 'console')
knightly.register('logger', 'winston', logger)
knightly.register('middleware', resolve('middleware'))

logger.debug('knightly running')
logger.error(new Error('Error test'))

const commands = resolve('commands')
knightly.register('commands', commands, {
  groupedCommands: true
})
knightly.on('commander:registered', logger.log)

knightly.on('ready', () => {
  const users = knightly.users.size

  /*
    * 0 = Playing
    * 1 = Twitch
    * 2 = Listening to
    * 3 = Watching
    */

  const statuses = [
    { type: 3, name: 'twitch streams' },
    { type: 3, name: 'you type' },
    { type: 0, name: `with ${users} users` },
    { type: 2, name: `to ${users} users` },
    { type: 3, name: `${users} users` },
    { type: 1, name: 'on twitch. i think.', url: 'https://www.twitch.tv/zetari_' }
  ]

  knightly.changeStatus = () => {
    let type
    const cstat = statuses[~~(Math.random() * statuses.length)]
    if (cstat.type === 0) type = 'Playing'
    if (cstat.type === 1) type = 'Twitch:'
    if (cstat.type === 2) type = 'Listening'
    if (cstat.type === 3) type = 'Watching'
    if (!cstat.url) knightly.editStatus({ name: cstat.name, type: cstat.type || 0 })
    if (cstat.url != null) knightly.editStatus({ name: cstat.name, type: cstat.type || 0, url: cstat.url })
    logger.info(chalk.yellow.bold(`Status changed: '${type} ${cstat.name}'`))
  }

  knightly.checkTwitch = async () => {
    let game
    // TODO: Get the user's ID
    // This function isn't functional atm
    await got('https://api.twitch.tv/helix/users?user_id=', {
      headers: {
        'Client-ID': process.env.CLIENT_ID
      }
    })
    try {
      console.log(JSON.parse(game.body))
    } catch (e) {
      logger.error(e)
    }
  }

  setInterval(() => knightly.changeStatus(), 120000)
  // setInterval(() => knightly.checkTwitch(), 10000)
  logger.info(`Logged in as ${knightly.user.username}`)
})

knightly.run()

process.on('unhandledRejection', (reason, promise) => {
  if (typeof reason === 'undefined') return
  logger.error(`Unhandled rejection: ${reason} - ${util.inspect(promise)}`)
})

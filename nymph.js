//
// nymph.js
// an irc bot module
//
// by stagas
//
// mit licenced
//

var EventEmitter = require('events').EventEmitter
  , Irc = require('irc')
  , Store = require('./ministore')
  , bots = []

process.on('uncaughtException', function(e) {
  console.log(e.stack)
  try {
    bots.forEach(function(bot) {
      bot.client.disconnect('bye')
    })
  } catch(e) {
    setTimeout(function() {
      process.exit(0)
    }, 500)
  }
})

module.exports = function Bot(config) {
  var bot = new EventEmitter()

  bot.store = Store('bot-data')
  bot.custom = bot.store('custom')

  bot.client = new(Irc).Client(config.server, config.nick, {
    channels: config.channels
  })

  bot.client.me = function(channel, text) {
    this.say(channel, '\u0001ACTION ' + text + '\u0001')
  }

  ;['registered', 'motd', 'names', 'topic'
  , 'join', 'part', 'kick', 'quit', 'message', 'pm'
  , 'notice', 'nick', 'invite', 'raw', 'error'].forEach(function(ev) {
    bot.client.on(ev, function() {
      var args = [].slice.call(arguments)
      args.unshift(ev)
      bot.emit.apply(bot, args)
    })
  })

  bot.Reply = function(nick, channel) {
    if (!(this instanceof bot.Reply)) return new bot.Reply(nick, channel)
    for (var k in bot) {
      this[k] = bot[k]
    }
    this.nick = nick
    this.channel = channel
  }

  bot.Reply.prototype.say = function(msg, nick) {
    this.client.say(
      this.channel
        ? this.channel
        : nick || this.nick
    , msg.substr(0, 300)
    )
    return true
  }

  bot.Reply.prototype.reply = function(msg) {
    this.say(
      this.channel
        ? this.nick + ': ' + msg
        : msg
    )
    return true
  }

  bot.Reply.prototype.replyTo = function(nick, msg) {
    this.say(
      this.channel
        ? nick + ': ' + msg
        : msg
    )
    return true
  }

  bot.on('pm', function(nick, text) {
    bot.emit.call(
      bot.Reply(nick)
    , 'tome'
    , { nick: nick
      , msg: text
      , cmd: text.split(' ')[0]
      , args: text.split(' ').slice(1)
      }
    )
  })

  bot.on('message', function(nick, to, text) {
    console.log(nick, to, text, text.substr(0, config.nick.length))
    if (~config.channels.indexOf(to.toLowerCase())) {
      if (text.substr(0, config.nick.length) == config.nick) {
        bot.emit.call(
          bot.Reply(nick, to)
        , 'tome'
        , { nick: nick
          , msg: text.split(' ').slice(1).join(' ')
          , cmd: text.split(' ')[1]
          , args: text.split(' ').slice(2)
          }
        )
      }
    }
  })

  bot.on('raw', function(msg) {
    console.log(msg.prefix + ':', msg.command, msg.args.join(' '))
  })

  bot.on('error', function(e) {
    console.log(e)
  })

  bots.push(bot)
  return bot
}

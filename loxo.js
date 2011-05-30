//
// loxo.js
//
// a nymph irc bot
// by stagas
//
// mit licenced
//

var fs = require('fs')
  , bot = require('./nymph')({
      server   : 'irc.freenode.net'
    , port     : 7000
    , nick     : 'loxo'
    , channels : [ '#loxo' ]
    })
  , Sandbox = new(require('sandbox'))({ shovel: __dirname + '/shovel.js' })
  , sandbox = Sandbox.run.bind(Sandbox)

bot.on('tome', function(input) {
  var self = this
  var nick = input.nick
    , msg = input.msg
    , cmd = input.cmd
    , args = input.args

  switch (cmd) {
    case 'hi':
      return this.say('hello, ' + nick)
      break
    case 'assign':
      cmd = safe(args[0])
      if (null == cmd) return this.reply('did not assign anything')
      this.custom.set(
        cmd
      , args.slice(1).join(' ')
      )
      return this.reply('assigned "' + args[0] + '"')
      break
    case 'delete':
      cmd = safe(args[0])
      return this.custom.del(cmd)
        ? this.reply('deleted "' + cmd + '"')
        : this.reply('command "' + cmd + '" not found')
      break
    case 'cmd':
    case 'cmds':
    case 'commands':
      return this.reply(this.custom.list.join(' '))
      break
    case 'src':
    case 'source':
      cmd = safe(args[0])
      if (null == cmd) return this.reply('try this: source <command>')
      var source = this.custom.get(cmd)
      return source
        ? this.reply(source)
        : this.reply('no source available for "' + cmd + '"')
      break
    case 'quit':
      return this.client.disconnect('bye')
      break
    default:
      function replySandbox(output) {
        var msg = output.result !== 'undefined'
            ? output.result 
            : output.console.join(' ')
        msg = msg && msg.length && msg.toString().replace(/\r|\n|\t/igm, '')
        self.reply(msg || "you need to do better than that")
      }
      var func = this.custom.get(cmd)
      return func
        ? sandbox(func, { name: cmd, nick: nick, args: args, dirname: __dirname }, replySandbox)
        : sandbox(msg, { name: nick, nick: nick, args: args, dirname: __dirname }, replySandbox)
      break
  }
})

// utils
function safe(s) {
  if (s == null) return null
  return s.toString().toLowerCase().replace(/[^\w \xC0-\xFF]/gim, '')
}
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
  , manual = {}

bot.on('tome', function(input) {
  var self = this
  var nick = input.nick
    , msg = input.msg
    , cmd = input.cmd
    , args = input.args

  if (cmd === '@' || cmd[0] === '@') {
    if (cmd === '@') {
      nick = this.nick = args[0]
      cmd = args[1]
      args = args.slice(2)
    } else {
      nick = this.nick = cmd.slice(1)
      cmd = args[0]
      args = args.slice(1)
    }
  }

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
    case 'man':
    case 'manual':
      return this.reply(getManual(args[0]) || 'nothing found :(')
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

// manual
;(function readManual() {
  var manualTxt = require('fs').readFileSync(__dirname + '/nodejsmanual.txt', 'utf8').split('\r\n\r\n')
  for (var i = 0, line, len = manualTxt.length; i < len; i++) {
    line = manualTxt[i].replace(/\r\n/gm, ' ')
    if (line.substr(0, 3) === '###')
      manual[line.split(' ').slice(1).join(' ')] = manualTxt[i + 1].replace(/\r\n/gm, ' ').split('Example:').join('')
  }
}())

function getManual(s) {
  s = s.toLowerCase()
  for (var k in manual) {
    if (~k.toLowerCase().indexOf(s) && k[s.length] === '(') {
      return k + ' - ' + manual[k]
    }
  }
  for (var k in manual) {
    if (~k.toLowerCase().indexOf(s)) {
      return k + ' - ' + manual[k]
    }
  }  
  return false
}

// utils
function safe(s) {
  if (s == null) return null
  return s.toString().toLowerCase().replace(/[^\w \xC0-\xFF]/gim, '')
}
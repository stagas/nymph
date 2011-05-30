// nymph sandbox shovel
//
// by stagas
//
// modified version of:
// shovel.js - Do the heavy lifting in this sandbox
// Gianni Chiappetta - gf3.ca - 2010

/* ------------------------------ INIT ------------------------------ */
var util = require('util')
  , path = require('path')
  , crypto = require('crypto')
  , Store = require('./ministore')('store')
  , code
  , console
  , fsops = 5
  , result
  , sandbox
  , Script
  , stdin

var args = JSON.parse(process.env.ARGS)

if (!(Script = process.binding('evals').NodeScript))
  Script = process.binding('evals').Script

/* ------------------------------ Sandbox ------------------------------ */
// Sandbox methods
function toFunction(s) {
  var result = (function() {
    try {
      return Script.runInNewContext('eval(' + s + ')')
    }
    catch (e) {
      return e.name + ': ' + e.message
    }
  }())
  return result
}
var ProxyStore = function(name) {
  var proxy = Store(name)
  return {
    get: function(key) {
      return proxy.get(key)
    }
  , set: function(key, val) {
      return --fsops && proxy.set(key, val)
    }
  , del: function(key) {
      return --fsops && proxy.del(key)
    }
  , clear: function() {
      return --fsops && proxy.clear()
    }
  , get list() {
      return proxy.list
    }
  , get length() {
      return proxy.length
    }
  , forEach: function(fn) {
      return proxy.forEach(fn)
    }
  , func: function(key) {
      return toFunction(proxy.get(key))
    }
  }
}

var thisStore = ProxyStore(args.name)

console = []
sandbox = {
  console: {
    log: function() {
      var i, l, msg
      for ( i = 0, l = arguments.length; i < l; i++ ) {
        msg = util.inspect(arguments[i])
        if (msg && msg.length > 2 && msg[0] === "'" && msg[msg.length - 1] === "'") {
          msg = msg.substr(1, msg.length - 2)
        }
        console.push(msg)
      }
    }
  }
}
sandbox.say = sandbox.print = sandbox.console.log
sandbox.get = thisStore.get
sandbox.set = thisStore.set
sandbox.del = thisStore.del
sandbox.list = thisStore.list
sandbox.length = thisStore.length
sandbox.forEach = thisStore.forEach
sandbox.clear = thisStore.clear
sandbox.func = thisStore.func
sandbox.load = function(name) {
  return ProxyStore(name)
}

if (args.args) {
  sandbox.a = args.args[0]
  sandbox.b = args.args[1]
  sandbox.c = args.args[2]
  sandbox.d = args.args[3]
  sandbox.e = args.args[4]
  sandbox.f = args.args[5]
  sandbox.args = args.args
}

// Get code
code = ''
stdin = process.stdin
stdin.resume()
stdin.setEncoding('utf8')
stdin.on('data', function(data) {
  code += data
})
stdin.on('end', run)

// Run code
function run() {
  result = (function() {
    try {
      return Script.runInNewContext('with(this){' + this.toString() + '}', sandbox)
    }
    catch (e) {
      return e.name + ': ' + e.message
    }
  }).call(code)
  
  process.stdout.on('drain', function() {
    process.exit(0)
  })

  var msg = util.inspect(result)
  if (msg && msg.length > 2 && msg[0] === "'" && msg[msg.length - 1] === "'") {
    msg = msg.substr(1, msg.length - 2)
  }
  process.stdout.write(JSON.stringify({ result: msg, console: console }))
}

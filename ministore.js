//
// ministore
// by stagas
//
// mit licenced
//

var path = require('path')
  , fs = require('fs')

module.exports = function Base(base) {
  base = path.normalize(base)
  if (!path.existsSync(base)) fs.mkdirSync(base, 0755)

  return function Store(name) {
    name = name.replace(/(\.\.)+|\/+/gim, '')
    if (~name.indexOf('..')) return null
    var datafile = path.normalize(path.join(base, name))
    var data
    try {
      data = JSON.parse(fs.readFileSync(datafile, 'utf8'))
    } catch(e) {
      data = {}
    }
    return {
      get: function(key) {
        if (null == key) return
        if (data.propertyIsEnumerable(key)) {
          return data[key]
        }
      }
    , set: function(key, val) {
        if (null == key || null == val) return
        data[key] = val && val.toString() || ''
        try {
          fs.writeFileSync(datafile, JSON.stringify(data, null, '  '), 'utf8')
          return true
        } catch(e) {
          return
        }
      }
    , del: function(key) {
        delete data[key]
        try {
          fs.writeFileSync(datafile, JSON.stringify(data, null, '  '), 'utf8')
          return true
        } catch(e) {
          return
        }
      }
    , clear: function() {
        data = {}
        try {
          fs.writeFileSync(datafile, '{}', 'utf8')
          return true
        } catch(e) {
          return
        }
      }
    , get list() {
        return Object.keys(data).sort()
      }
    , get length() {
        return Object.keys(data).length
      }
    , forEach: function(fn) {
        Object.keys(data).sort().forEach(function(key) {
          fn.call(data[key], key, data[key].toString())
        })
      }
    }
  }
}

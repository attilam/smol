const Handlebars = require('handlebars')
const util = require('./util')

Handlebars.registerHelper('inc', function (value) {
  return parseInt(value) + 1
})

Handlebars.registerHelper('raw-block', options => options.fn())

// via https://stackoverflow.com/questions/8980842/convert-slug-variable-to-title-text-with-javascript
Handlebars.registerHelper('titleize', (value) => {
  const words = value.split('_')

  return words.map(word => {
    return word.charAt(0).toUpperCase() + word.substring(1)
  }).join(' ')
})

Handlebars.registerHelper('assets', (context) => {
  const items = util.genList(context)

  context.data.index = 0
  return items.reduce((acc, item) => {
    acc += context.fn(item)
    context.data.index++

    return acc
  }, '')
})

Handlebars.registerHelper('created_at', (template, context) => {
  return util.dateFormat(template, context.data.root.created_at)
})

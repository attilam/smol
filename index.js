const fs = require('fs')

const SimpleMarkdown = require('./simple-markdown.min')
const mdParse = SimpleMarkdown.defaultBlockParse
const mdOutput = SimpleMarkdown.defaultHtmlOutput

const Handlebars = require('handlebars')

// via https://stackoverflow.com/questions/22103989/adding-offset-to-index-when-looping-through-items-in-handlebars
Handlebars.registerHelper('inc', function (value, options) {
  return parseInt(value) + 1
})

const text = fs.readFileSync('./content/test.md', 'utf8')

const template = Handlebars.compile(text)

const data = {
  something: 'another thing',
  thingies: ['one', 'true', 'tree']
}

const result = template(data)

const tree = mdParse(result)

const out = mdOutput(tree)
console.log(out)

fs.writeFileSync('public/test.html', out)

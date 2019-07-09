// smol.js -- 2019 @attilam

const fs = require('fs')

const fm = require('front-matter')

const SimpleMarkdown = require('./simple-markdown.min')
const mdParse = SimpleMarkdown.defaultBlockParse
const mdOutput = SimpleMarkdown.defaultHtmlOutput

const Handlebars = require('handlebars')

Handlebars.registerHelper('inc', function (value, options) {
  return parseInt(value) + 1
})

// === Generate Page

// load content & strip front matter
const content = fm(fs.readFileSync('./content/test.md', 'utf8'))

// apply Handlebars to content
const contentTemplate = Handlebars.compile(content.body)

const contentTemplated = contentTemplate({ ...content.attributes })

// convert markdown to html
const htmlBody = mdOutput(mdParse(contentTemplated))

// load layout
const layoutName = content.attributes.layout || 'default'
const layout = fs.readFileSync(`./layouts/${layoutName}.html`, 'utf8')

// apply Handlebars to layout
const layoutTemplate = Handlebars.compile(layout)

const layoutContext = { ...content.attributes, body: htmlBody }

const layoutTemplated = layoutTemplate(layoutContext)

// save page
fs.writeFileSync('public/test.html', layoutTemplated)

console.log(layoutTemplated)

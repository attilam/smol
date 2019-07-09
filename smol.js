// === smol.js -- 2019 @attilam
//
const fs = require('fs')
const fm = require('front-matter')

// === Simple-Markdown
//
const SimpleMarkdown = require('./simple-markdown.min')
const mdParse = SimpleMarkdown.defaultBlockParse
const mdOutput = SimpleMarkdown.defaultHtmlOutput

function markdownToHTML (source) {
  return mdOutput(mdParse(source))
}

// === Handlebars stuff
//
const Handlebars = require('handlebars')

Handlebars.registerHelper('inc', function (value, options) {
  return parseInt(value) + 1
})

Handlebars.registerHelper('partial', function (value, options) {
  return fs.readFileSync(`./layouts/partials/${value}.html`, 'utf8')
})

function applyHandlebars (template, context) {
  const compiled = Handlebars.compile(template)

  return compiled(context)
}

// === Generate Page
//
// load content & strip front matter
const content = fm(fs.readFileSync('./content/test.md', 'utf8'))

// apply Handlebars to content
const contentTemplated = applyHandlebars(content.body, {...content.attributes})

// convert markdown to html
const htmlBody = markdownToHTML(contentTemplated)

// load layout
const layoutName = content.attributes.layout || 'default'
const layout = fs.readFileSync(`./layouts/${layoutName}.html`, 'utf8')

// apply Handlebars to layout
const layoutContext = { ...content.attributes, body: htmlBody }
const layoutTemplated = applyHandlebars(layout, layoutContext)

// save page
fs.writeFileSync('public/test.html', layoutTemplated)

console.log(layoutTemplated)

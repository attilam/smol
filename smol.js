// === smol.js -- 2019 @attilam
//
const fs = require('fs')
const path = require('path')

// via https://gist.github.com/kethinov/6658166
const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    filelist = fs.statSync(path.join(dir, file)).isDirectory()
      ? walkSync(path.join(dir, file), filelist)
      : filelist.concat(path.join(dir, file))
  })

  return filelist
}

// === YAML, front matter & config stuff
//
const YAML = require('js-yaml')
const fm = require('front-matter')

const siteConfig = YAML.safeLoad(fs.readFileSync(`./config.yml`, 'utf8'))

// === Simple-Markdown
//
const SimpleMarkdown = require('./simple-markdown')
const mdParse = SimpleMarkdown.defaultBlockParse
const mdOutput = SimpleMarkdown.defaultHtmlOutput

function markdownToHTML (source) {
  return mdOutput(mdParse(source))
}

// === Handlebars stuff
//
const Handlebars = require('handlebars')

walkSync('./layouts/partials').forEach(partial => {
  const partialName = path.basename(partial, '.html')

  Handlebars.registerPartial(partialName, fs.readFileSync(partial, 'utf8'))
  console.log(`Partial: ${partialName}`)
})

Handlebars.registerHelper('inc', function (value, options) {
  return parseInt(value) + 1
})

function applyHandlebars (template, context) {
  const compiled = Handlebars.compile(template)

  return compiled(context)
}

// === Generate Page
//
function renderPage (body, context) {
  const html = applyHandlebars(markdownToHTML(body), context)

  const layoutName = context.layout || 'default'
  const layout = fs.readFileSync(`./layouts/${layoutName}.html`, 'utf8')

  const layoutContext = { ...context, body: html }

  return applyHandlebars(layout, layoutContext)
}

// via https://stackoverflow.com/questions/8980842/convert-slug-variable-to-title-text-with-javascript
function titleize (slug) {
  const words = slug.split('_')

  return words.map(word => {
    return word.charAt(0).toUpperCase() + word.substring(1)
  }).join(' ')
}

// === Generate Site
//
for (let key in siteConfig.routes) {
  const route = siteConfig.routes[key]

  walkSync(route.sourcePath).forEach(file => {
    if (route.skip !== undefined && route.skip.some(skip => file.includes(skip))) return

    const content = fm(fs.readFileSync(file, 'utf8'))

    const context = {
      ...siteConfig,
      ...route,
      title: titleize(path.basename(file, '.md')),
      ...content.attributes
    }

    const result = renderPage(content.body, context)

    const filePath = path.dirname(file.replace(route.sourcePath, ''))
    const outPath = path.join(siteConfig.destPath, route.destPath, filePath)
    if (!fs.existsSync(outPath)) fs.mkdirSync(outPath)

    const outName = path.basename(file, '.md')
    const targetFileName = `${outPath}/${outName}.html`
    console.log(targetFileName)

    fs.writeFileSync(`${targetFileName}`, result)
  })
}

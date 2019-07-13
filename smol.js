// === smol.js -- 2019 @attilam
//
const fs = require('fs')
const path = require('path')

// via https://gist.github.com/kethinov/6658166
const walkDirectoriesSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    filelist = fs.statSync(path.join(dir, file)).isDirectory()
      ? walkDirectoriesSync(path.join(dir, file), filelist)
      : filelist.concat(path.join(dir, file))
  })

  return filelist
}

// via https://geedew.com/remove-a-directory-that-is-not-empty-in-nodejs/
function deleteDirectoryRecursive (directory) {
  if (fs.existsSync(directory)) {
    fs.readdirSync(directory).forEach(function (file, index) {
      var curPath = directory + '/' + file
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteDirectoryRecursive(curPath)
      } else { // delete file
        fs.unlinkSync(curPath)
      }
    })
    fs.rmdirSync(directory)
  }
}

function createDirectoryRecursive (directory) {
  if (!fs.existsSync(directory)) fs.mkdirSync(directory, {recursive: true})
}

// === YAML, front matter & config stuff
//
const YAML = require('js-yaml')
const frontMatter = require('front-matter')

const config = {
  generator: 'smol',
  destPath: 'public/',
  textFiles: ['.md', '.markdown', '.html', '.htm', '.txt', '.css'],
  theme: 'basic',
  ...(YAML.safeLoad(fs.readFileSync(`./config.yml`, 'utf8')))
}

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

Handlebars.registerHelper('inc', function (value, options) {
  return parseInt(value) + 1
})

// via https://stackoverflow.com/questions/8980842/convert-slug-variable-to-title-text-with-javascript
Handlebars.registerHelper('titleize', (value, options) => {
  const words = value.split('_')

  return words.map(word => {
    return word.charAt(0).toUpperCase() + word.substring(1)
  }).join(' ')
})

const applyHandlebars = (template, context) => Handlebars.compile(template)(context)

// === Theme support
//
const themeDirectory = `themes/${config.theme}`

// add theme's assets directory to routes
const themeAssetsDirectory = `${themeDirectory}/assets/`

if (fs.existsSync(themeAssetsDirectory)) {
  config.routes[`theme:${config.theme}`] = {
    sourcePath: themeAssetsDirectory,
    destPath: '/'
  }
}

walkDirectoriesSync(`${themeDirectory}/partials`).forEach(partial => {
  const partialName = path.basename(partial, path.extname(partial))

  Handlebars.registerPartial(partialName, fs.readFileSync(partial, 'utf8'))
})

function applyLayout (context) {
  const layoutName = `${themeDirectory}/${context.layout || config.layout || 'default'}.html`

  if (fs.existsSync(layoutName)) {
    const layout = fs.readFileSync(layoutName, 'utf8')
    context.body = applyHandlebars(layout, context)
  }

  return context
}

// === Files and filters
//
const assets = []

const fileRules = [
  {
    match: fileName => /\.(md|markdown)$/.test(fileName),
    outExt: '.html',
    needsLayout: true,
    processFile: (context) => {
      context.body = markdownToHTML(context.body)
      return context
    }
  },
  {
    match: fileName => /\.(htm|html)$/.test(fileName),
    outExt: '.html',
    needsLayout: true
  },
  { // fallback rule: just copy file as-is
    match: fileName => true
  }
]

// === Generate Site
//
deleteDirectoryRecursive(config.destPath)

// first gather all assets, create metadata/context
for (let key in config.routes) {
  const route = config.routes[key]

  console.log(`route: ${key}`)

  walkDirectoriesSync(route.sourcePath).forEach(fileFullPath => {
    if (route.skip !== undefined && route.skip.find(skip => fileFullPath.includes(skip))) return

    const filePath = path.dirname(fileFullPath.replace(route.sourcePath, ''))
    const fileName = path.basename(fileFullPath)
    const fileExt = path.extname(fileFullPath)
    const fileBaseName = path.basename(fileName, fileExt)

    let asset = { ...route, site: config, filePath, fileName, fileExt, fileBaseName, fileFullPath }

    if (config.textFiles.find(tf => tf === fileExt)) {
      const res = frontMatter(fs.readFileSync(fileFullPath, 'utf8'))

      asset = { ...asset, ...res.attributes, body: res.body, textFile: true }
    }

    if (asset.is_draft) return

    let rule = fileRules.find(r => r.match(fileFullPath))

    const outFilePath = path.join(config.destPath, route.destPath, filePath)
    const outFileBaseName = asset.slug || fileBaseName
    const outFileExt = asset.pass_through ? fileExt : (rule.outExt || fileExt)
    const outFullPath = `${outFilePath}/${outFileBaseName}${outFileExt}`

    asset = { ...asset, rule, outFilePath, outFileBaseName, outFileExt, outFullPath }
    assets.push(asset)
  })
}

// then process all files, and write them to destPath
assets.forEach(asset => {
  console.log(asset.outFullPath)

  if (!asset.pass_through) {
    if (asset.rule.processFile !== undefined) asset = asset.rule.processFile(asset)

    if (asset.textFile) asset.body = applyHandlebars(asset.body, asset)
    if (asset.rule.needsLayout || asset.needsLayout) asset = applyLayout(asset)
  }

  createDirectoryRecursive(asset.outFilePath)

  if (asset.body === undefined) { // if no processed body, just copy original file
    fs.copyFileSync(asset.fileFullPath, asset.outFullPath)
  } else {
    fs.writeFileSync(`${asset.outFullPath}`, asset.body)
  }
})

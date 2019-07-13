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

Handlebars.registerHelper('inc', function (value) {
  return parseInt(value) + 1
})

const applyHandlebars = (template, context) => Handlebars.compile(template)(context)

// via https://stackoverflow.com/questions/8980842/convert-slug-variable-to-title-text-with-javascript
Handlebars.registerHelper('titleize', (value) => {
  const words = value.split('_')

  return words.map(word => {
    return word.charAt(0).toUpperCase() + word.substring(1)
  }).join(' ')
})

Handlebars.registerHelper('assets', (context) => {
  let items

  let filterBy = context.hash['filterBy']
  if (filterBy) {
    let parts = filterBy.split('=')
    let key = parts[0].trim()
    let value = parts[1].trim()

    items = context.data.root.site.assets.filter(item => {
      if (Array.isArray(item[key])) {
        return item[key].find(it => it === value)
      } else {
        return (item[key] === value)
      }
    })
  } else {
    items = [...context.data.root.site.assets]
  }

  const sortBy = context.hash['sortBy']
  if (sortBy) {
    let parts = sortBy.split(',')
    let sort = parts[0]
    let inc = true
    if (parts.length === 2) inc = parts[1] === 'inc'

    items = items.sort((a, b) => {
      if (a[sort] < b[sort]) return inc ? -1 : 1
      if (a[sort] > b[sort]) return inc ? 1 : -1
      return 0
    })
  }

  let result = ''
  for (let i = 0; i < items.length; i++) {
    context.data.index = i
    result += context.fn(items[i])
  }

  return result
})

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
for (let routeName in config.routes) {
  const route = config.routes[routeName]

  console.log(`route: ${routeName}`)

  walkDirectoriesSync(route.sourcePath).forEach(fileFullPath => {
    if (route.skip !== undefined && route.skip.find(skip => fileFullPath.includes(skip))) return

    const filePath = path.dirname(fileFullPath.replace(route.sourcePath, ''))
    const fileName = path.basename(fileFullPath)
    const fileExt = path.extname(fileFullPath)
    const fileBaseName = path.basename(fileName, fileExt)

    let asset = { ...route, routeName, site: { ...config, assets }, filePath, fileName, fileExt, fileBaseName, fileFullPath }

    if (config.textFiles.find(tf => tf === fileExt)) {
      const res = frontMatter(fs.readFileSync(fileFullPath, 'utf8'))

      asset = { ...asset, ...res.attributes, body: res.body, textFile: true }
    }

    if (asset.is_draft) return

    let rule = fileRules.find(r => r.match(fileFullPath))

    const outFilePath = path.join(config.destPath, route.destPath, filePath)
    const outFileBaseName = asset.slug || fileBaseName
    const outFileExt = asset.pass_through ? fileExt : (rule.outExt || fileExt)
    const outFileName = `${outFileBaseName}${outFileExt}`
    const outFullPath = `${outFilePath}/${outFileBaseName}${outFileExt}`

    const sitelink = path.join(route.destPath, filePath, outFileName)
    const permalink = path.join(config.baseUrl, sitelink)

    asset.title = asset.title || outFileName

    asset = { ...asset, rule, outFilePath, outFileBaseName, outFileExt, outFileName, outFullPath, sitelink, permalink }
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

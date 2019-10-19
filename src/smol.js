// === smol.js -- 2019 @attilam
//
const fs = require('./fs')
const path = require('path')

require('./hb-helpers')

// === YAML, front matter & config stuff
//
const YAML = require('js-yaml')
const frontMatter = require('front-matter')
const baseConfig = require('./config')

const config = {
  ...baseConfig,
  ...(YAML.safeLoad(fs.readFileSync(`./config.yml`, 'utf8')))
}

// === Handlebars stuff
//
const Handlebars = require('handlebars')

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

fs.walkDirectoriesSync(`${themeDirectory}/partials`).forEach(partial => {
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

const fileRules = require('./rules');

// === Generate Site
//
fs.deleteDirectoryRecursive(config.destPath)

// first gather all assets, create metadata/context
for (let routeName in config.routes) {
  const route = config.routes[routeName]

  console.log(`route: ${routeName}`)

  fs.walkDirectoriesSync(route.sourcePath).forEach(fileFullPath => {
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

    if (!(asset.created_at instanceof Date)) {
      // console.warn(`  using file date for ${fileFullPath}`)
      asset.created_at = (fs.statSync(fileFullPath)).birthtime
    }

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

  fs.createDirectoryRecursive(asset.outFilePath)

  if (asset.body === undefined) { // if no processed body, just copy original file
    fs.copyFileSync(asset.fileFullPath, asset.outFullPath)
  } else {
    fs.writeFileSync(`${asset.outFullPath}`, asset.body)
  }
})

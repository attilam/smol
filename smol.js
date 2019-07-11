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

const siteConfig = {
  generator: 'smol',
  destPath: 'public/',
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

walkDirectoriesSync('./layouts/partials').forEach(partial => {
  const partialName = path.basename(partial, path.extname(partial))

  Handlebars.registerPartial(partialName, fs.readFileSync(partial, 'utf8'))
})

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

// === Generate Page
//
function applyLayout (context) {
  const layoutName = context.layout || 'default'
  const layout = fs.readFileSync(`./layouts/${layoutName}.html`, 'utf8')

  return applyHandlebars(layout, context)
}

// === Rules for different file types
//
const fileRules = [
  {
    match: fileName => /\.(md|markdown)$/.test(fileName),
    outExt: '.html',
    processFile: file => {
      const res = frontMatter(fs.readFileSync(file, 'utf8'))
      const context = { ...res.attributes, site: siteConfig }

      context.body = applyHandlebars(markdownToHTML(res.body), context)

      context.body = applyLayout(context)
      return context
    }
  },
  {
    match: fileName => /\.(htm|html)$/.test(fileName),
    outExt: '.html',
    processFile: file => {
      const res = frontMatter(fs.readFileSync(file, 'utf8'))
      const context = { ...res.attributes, site: siteConfig }

      context.body = applyHandlebars(res.body, context)

      context.body = applyLayout(context)
      return context
    }
  },
  { // fallback rule: just copy file as-is
    match: fileName => true,
    processFile: file => ({ site: siteConfig })
  }
]

// === Generate Site
//
deleteDirectoryRecursive(siteConfig.destPath)

for (let key in siteConfig.routes) {
  const route = siteConfig.routes[key]

  walkDirectoriesSync(route.sourcePath).forEach(file => {
    if (route.skip !== undefined && route.skip.some(skip => file.includes(skip))) return

    const filePath = path.dirname(file.replace(route.sourcePath, ''))
    const fileName = path.basename(file)
    const fileExt = path.extname(file)
    const fileBaseName = path.basename(fileName, fileExt)

    let rule
    for (const r of fileRules) {
      if (r.match(file)) {
        rule = r
        break
      }
    }

    if (rule === undefined) {
      console.error(`Can't match any rule for ${file}`)
      return
    }

    const context = rule.processFile(file)

    const outFilePath = path.join(siteConfig.destPath, route.destPath, filePath)
    const outFileBaseName = context.slug || fileBaseName
    const outFileExt = rule.outExt || fileExt
    const outFullPath = `${outFilePath}/${outFileBaseName}${outFileExt}`

    console.log(outFullPath)

    createDirectoryRecursive(outFilePath)

    if (context.body === undefined) {
      fs.copyFileSync(file, outFullPath)
    } else {
      fs.writeFileSync(`${outFullPath}`, context.body)
    }
  })
}

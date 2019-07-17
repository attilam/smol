// === smol.js -- 2019 @attilam
//
const fs = require('fs')
const path = require('path')
const execSync = require('child_process').execSync

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

function genList (context) {
  let items

  // first filter the assets
  let filterBy = context.hash['filterBy']
  if (filterBy) {
    let parts = filterBy.split('=')
    let key = parts[0].trim()
    let value
    if (parts.length === 2) value = parts[1].trim()

    items = context.data.root.site.assets.filter(item => {
      if (value === undefined) return item[key] !== undefined

      if (Array.isArray(item[key])) {
        return item[key].find(it => it === value)
      } else {
        return (item[key] === value)
      }
    })
  } else {
    items = [...context.data.root.site.assets]
  }

  // ...then sort them
  const sortBy = context.hash['sortBy']
  if (sortBy) {
    let parts = sortBy.split(',')
    let key = parts[0].trim()
    let inc = true
    if (parts.length === 2) inc = parts[1].trim() === 'inc'

    items = items.sort((a, b) => {
      if (a[key] < b[key]) return inc ? -1 : 1
      if (a[key] > b[key]) return inc ? 1 : -1
      return 0
    })
  }

  return items
}

// via https://gist.github.com/micah1701/4120120
// modified for formatting +
// dates default to UTC date unless the format starts with `#`
// because in this context I don't care about timezones usually
/**
 * Return a formated string from a date Object mimicking PHP's date() functionality
 *
 * format  string  "Y-m-d H:i:s" or similar PHP-style date format string
 * date    mixed   Date Object, Datestring, or milliseconds
 *
 */
function dateFormat (format, date) {
  if (!date || date === '') {
    date = new Date()
  } else if (!(date instanceof Date)) {
    date = new Date(date.replace(/-/g, '/')) // attempt to convert string to date object
  }

  let string = ''

  let useLocalTime = false
  if (format.startsWith('#')) {
    useLocalTime = true
    format = format.substring(1)
  }

  let mo = useLocalTime ? date.getMonth() : date.getUTCMonth()
  let m1 = mo + 1
  let dow = useLocalTime ? date.getDay() : date.getUTCDay()
  let d = useLocalTime ? date.getDate() : date.getUTCDate()
  let y = useLocalTime ? date.getFullYear() : date.getUTCFullYear()
  let h = useLocalTime ? date.getHours() : date.getUTCHours()
  let mi = useLocalTime ? date.getMinutes() : date.getUTCMinutes()
  let s = useLocalTime ? date.getSeconds() : date.getUTCSeconds()

  for (let i = 0, len = format.length; i < len; i++) {
    switch (format[i]) {
      case 'j': // Day of the month without leading zeros  (1 to 31)
        string += d
        break
      case 'd': // Day of the month, 2 digits with leading zeros (01 to 31)
        string += (d < 10) ? '0' + d : d
        break
      case 'l': // (lowercase 'L') A full textual representation of the day of the week
        var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        string += days[dow]
        break
      case 'w': // Numeric representation of the day of the week (0=Sunday,1=Monday,...6=Saturday)
        string += dow
        break
      case 'D': // A textual representation of a day, three letters
        days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thr', 'Fri', 'Sat']
        string += days[dow]
        break
      case 'm': // Numeric representation of a month, with leading zeros (01 to 12)
        string += (m1 < 10) ? '0' + m1 : m1
        break
      case 'n': // Numeric representation of a month, without leading zeros (1 to 12)
        string += m1
        break
      case 'F': // A full textual representation of a month, such as January or March 
        var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        string += months[mo]
        break
      case 'M': // A short textual representation of a month, three letters (Jan - Dec)
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        string += months[mo]
        break
      case 'Y': // A full numeric representation of a year, 4 digits (1999 OR 2003)	
        string += y
        break
      case 'y': // A two digit representation of a year (99 OR 03)
        string += y.toString().slice(-2)
        break
      case 'H': // 24-hour format of an hour with leading zeros (00 to 23)
        string += (h < 10) ? '0' + h : h
        break
      case 'g': // 12-hour format of an hour without leading zeros (1 to 12)
        var hour = (h === 0) ? 12 : h
        string += (hour > 12) ? hour - 12 : hour
        break
      case 'h': // 12-hour format of an hour with leading zeros (01 to 12)
        hour = (h === 0) ? 12 : h
        hour = ( hour > 12) ? hour - 12 : hour
        string += (hour < 10) ? '0' + hour : hour
        break
      case 'a': // Lowercase Ante meridiem and Post meridiem (am or pm)
        string += (h < 12) ? 'am' : 'pm'
        break
      case 'i': // Minutes with leading zeros (00 to 59)
        string += (mi < 10) ? '0' + mi : mi
        break
      case 's': // Seconds, with leading zeros (00 to 59)
        string += (s < 10) ? '0' + s : s
        break
      case 'c': // ISO 8601 date (eg: 2012-11-20T18:05:54.944Z)
        string += date.toISOString()
        break
      default:
        string += format[i]
    }
  }

  return string
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

Handlebars.registerHelper('raw-block', options => options.fn())

// via https://stackoverflow.com/questions/8980842/convert-slug-variable-to-title-text-with-javascript
Handlebars.registerHelper('titleize', (value) => {
  const words = value.split('_')

  return words.map(word => {
    return word.charAt(0).toUpperCase() + word.substring(1)
  }).join(' ')
})

Handlebars.registerHelper('assets', (context) => {
  const items = genList(context)

  context.data.index = 0
  return items.reduce((acc, item) => {
    acc += context.fn(item)
    context.data.index++

    return acc
  }, '')
})

Handlebars.registerHelper('created_at', (template, context) => {
  return dateFormat(template, context.data.root.created_at)
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

// === Image processing
//
function resizeImage (inFile, outFile, resX, resY) {
  const crop = `${resX}x${resY}+0+0`
  const command = `convert ${inFile} -resize ${resX}x -resize x${resY} -gravity center -crop ${crop} +repage ${outFile}`

  execSync(command)
}

// === Files and filters
//
const assets = []

const fileRules = [
  {
    match: fileName => /\.(md|markdown)$/.test(fileName),
    outExt: '.html',
    needsLayout: true,
    processFile: context => {
      context.body = markdownToHTML(context.body)
      return context
    }
  },
  {
    match: fileName => /\.(htm|html)$/.test(fileName),
    outExt: '.html',
    needsLayout: true
  },
  {
    match: fileName => /\.(png|jpg|jpeg)$/.test(fileName),
    processFile: context => {
      const resX = 320
      const resY = 200

      const outFile = `${context.outFilePath}/${context.outFileBaseName}_${resX}x${resY}${context.outFileExt}`

      resizeImage(context.fileFullPath, outFile, resX, resY)

      return context
    }
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

  createDirectoryRecursive(asset.outFilePath)

  if (asset.body === undefined) { // if no processed body, just copy original file
    fs.copyFileSync(asset.fileFullPath, asset.outFullPath)
  } else {
    fs.writeFileSync(`${asset.outFullPath}`, asset.body)
  }
})

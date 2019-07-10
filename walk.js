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

const YAML = require('js-yaml')

const siteConfig = YAML.safeLoad(fs.readFileSync(`./config.yml`, 'utf8'))

console.log(siteConfig)

walkSync(siteConfig.routes.cheatsheets.path).forEach(file => {
  if (!siteConfig.routes.cheatsheets.skip.some(skip => file.includes(skip))) console.log(file)
})

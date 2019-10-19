const execSync = require('child_process').execSync
const SimpleMarkdown = require('./simple-markdown')

// === Image processing
//
function resizeImage (inFile, outFile, resX, resY) {
  const crop = `${resX}x${resY}+0+0`
  const command = `convert ${inFile} -resize ${resX}x -resize x${resY} -gravity center -crop ${crop} +repage ${outFile}`

  execSync(command)
}

function optimizeSVG (inFile) {
  const command = `svgo ${inFile} -o -`

  return execSync(command).toString()
}

// === RULES
//
const fileRules = [
  {
    match: fileName => /\.(md|markdown)$/.test(fileName),
    outExt: '.html',
    needsLayout: true,
    processFile: context => {
      context.body = SimpleMarkdown.markdownToHtml(context.body)
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
  {
    match: fileName => /\.(svg)$/.test(fileName),
    processFile: context => {
      context.body = optimizeSVG(context.fileFullPath)

      return context
    }
  },
  { // fallback rule: just copy file as-is
    match: fileName => true
  }
]

module.exports = fileRules

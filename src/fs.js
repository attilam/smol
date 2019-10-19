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

module.exports = {
  ...fs,
  walkDirectoriesSync,
  deleteDirectoryRecursive,
  createDirectoryRecursive
}

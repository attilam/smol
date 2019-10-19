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
        hour = (hour > 12) ? hour - 12 : hour
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

module.exports = {
  dateFormat,
  genList
}

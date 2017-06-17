const path = require('path')

const bodyParser = require('body-parser')
const compression = require('compression')
const cookieParser = require('cookie-parser')
const express = require('express')
const helmet = require('helmet')
const logger = require('morgan')
const nunjucks = require('nunjucks')
const serveFavicon = require('serve-favicon')
const serveStatic = require('serve-static')

const assets = require('./middlewares/assets')

const index = require('./routes/index')

const app = express()

app.use(helmet())
app.use(compression())

const env = nunjucks.configure(path.join(__dirname, 'views'), {
  autoescape: true,
  cache: false,
  express: app
})

// Sets Nunjucks as the Express template engine
app.set('engine', env)
app.set('view engine', 'njk')

app.enable('view cache') // Templace caching

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())

app.use(serveFavicon(path.join(__dirname, 'public', 'favicon.ico')))

function setCustomCacheControl(res, filePath) {
  const fileMime = serveStatic.mime.lookup(filePath)

  if (filePath === path.join(__dirname, 'public/sw.js')) {
    // https://toot.cafe/@nolan/614271
    res.setHeader('Cache-Control', 'public, max-age=0')
  }

  if (fileMime === 'text/html') {
    res.setHeader('Cache-Control', 'no-cache')
  }

  if (
    fileMime === 'text/css' ||
    fileMime === 'application/javascript' ||
    fileMime === 'image/svg+xml'
  ) {
    // Custom Cache-Control for CSS & JS files
    res.setHeader('Cache-Control', 'public, max-age=31536000')
  }
}

app.use(
  serveStatic(path.join(__dirname, 'public'), {
    setHeaders: setCustomCacheControl
  })
)

// Custom Middlewares
app.use(assets('/', '/public'))

// Custom routes
app.use('/', index)

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found')
  err.status = 404
  next(err)
})

// Error handler
app.use((err, req, res) => {
  // Set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // Render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app

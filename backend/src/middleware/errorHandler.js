// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err)

  const status = err.status || 500

  if (status >= 500) {
    console.error(err)
  }

  res.status(status).json({
    error: status >= 500 ? 'Σφάλμα διακομιστή' : err.message
  })
}

module.exports = errorHandler

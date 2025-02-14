function createStagingServer(app, port) {
  const httpPort = typeof port === 'string' ? Number(port) : port
  return app.listen(httpPort)
}

const headers = {
  'Content-Type': 'application/json',
}

module.exports = { createStagingServer, headers }

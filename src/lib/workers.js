function error (e) {
  if (e.response) {
    console.error(e.response.data || e.response.body || e.message)
  } else {
    console.error(e)
  }
}

export function wrap (workerCallback) {
  const wrapper = (job) => {
    const opts = {
      retryJobOnError: true
    }
    let input
    try {
      input = JSON.parse(job.payload)
    } catch (e) {
      error(e)
      process.exit(255)
    }
    workerCallback(input, job, opts)
      .then(result => {
        const data = result ? JSON.stringify(result) : null
        job.workComplete(data)
      })
      .catch(err => {
        error(err)
        if (opts.retryJobOnError) {
          process.exit(255)
        } else {
          job.reportError()
        }
      })
  }
  return wrapper
}

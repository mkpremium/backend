function error(e) {
  if (e.response) {
    console.error(e.response.data || e.response.body || e.message);
  } else {
    console.error(e);
  }
}

export function wrap(workerCallback) {
  const wrapper = (job, wrapper) => {
    let input;
    try {
      input = JSON.parse(job.payload);
    } catch (e) {
      error(e);
      process.exit(255);
    }
    workerCallback(input, job)
      .then(result => {
        const data = result ? JSON.stringify(result) : null;
        job.workComplete(data);
      })
      .catch(err => {
        error(err);
        if (wrapper.retryJobOnError) {
          process.exit(255);
        } else {
          job.reportError();
        }
      });
  };
  wrapper.retryJobOnError = true;
  return wrapper;
}

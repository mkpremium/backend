function error(e) {
  if (e.response) {
    console.error(e.response.data || e.response.body || e.message);
  } else {
    console.error(e);
  }
}

export function wrap(workerCallback) {
  return (job) => {
    let input;
    try {
      input = JSON.parse(job.payload);
    } catch (e) {
      error(e);
      job.reportError();
      return;
    }
    workerCallback(input, job)
      .then(result => {
        const data = result ? JSON.stringify(result) : null;
        job.workComplete(data);
      })
      .catch(err => {
        error(err);
        job.reportError();
      });
  };
}

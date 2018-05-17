export function wrap(workerCallback) {
  return (job) => {
    workerCallback(JSON.parse(job.payload), job)
      .then(result => {
        const data = result ? JSON.stringify(result) : null;
        job.workComplete(data);
      })
      .catch(err => {
        console.error(err);
        job.reportError();
      });
  };
}

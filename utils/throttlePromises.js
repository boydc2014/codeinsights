const os = require('os');
const cpu_n = os.cpus().length;

function throttlePromises(funcs, max = cpu_n) {
  let results = new Array(funcs.length).fill(undefined);
  let queue = [...funcs];
  let running = 0
  let index = 0;
  return new Promise((resolve, reject) => {
    function run() {
      while (running < max && queue.length > 0) {
        const task = queue.shift();
        running++;
        (function (i) {
          task()
            .then((data) => {
              results[i] = data;
              running--;
              run();
            })
            .catch((error) => reject(error))
        })(index);
        index++;
      }

      if (index === funcs.length && running === 0) {
        resolve(results);
      }
    }
    run();
  })
}

module.exports = {
  throttlePromises: throttlePromises
}
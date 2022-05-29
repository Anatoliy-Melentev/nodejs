const { workerData, parentPort } = require('worker_threads');
const { createReadStream, createWriteStream } = require('fs');

const { search, input, output } = workerData;

const readStream = createReadStream(input, 'utf8');
const writeStream = createWriteStream(output, { flags: 'a', encoding: 'utf8' });

let snip = '';
readStream.on('data', (chunk) => {
  const string = (snip + chunk.toString()).match(/^(.*)$/gm);
  snip = string.pop();
  const regexp = new RegExp(search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), 'gm');
  writeStream.write(`\n${string.filter(str => regexp.test(str)).join('\n')}`);
});

readStream.on('end', () => parentPort.postMessage({
  result: 'Files creating finished',
}));
readStream.on('error', () => console.log(parentPort.postMessage({
  result: err,
})));



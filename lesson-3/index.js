const { green, red } = require('colors/safe');
const { createReadStream, createWriteStream } = require('fs');

const IPfilters = [
  { name: '89.123.1.41', regexp: /^(89\.123\.1\.41.*)$/gm },
  { name: '176.212.24.22', regexp: /^(176\.212\.24\.22.*)$/gm }
]

const writes = IPfilters.map(({ name, regexp}) => ({
  regexp, stream: createWriteStream(`./${name}_requests.log`, { flags: 'a', encoding: 'utf8' }),
}));

const readStream = createReadStream('./access.log', 'utf8');

let snip = '';
readStream.on('data', (chunk) => {
  const string = (snip + chunk.toString()).match(/^(.*)$/gm);
  snip = string.pop();
  writes.forEach(({ regexp, stream }) => stream.write(`\n${string.filter(str => regexp.test(str)).join('\n')}`));
});

readStream.on('end', () => console.log(green('Files creating finished')));
readStream.on('error', () => console.log(red(err)));

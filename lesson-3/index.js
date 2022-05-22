const { green, red } = require('colors/safe');
const { createReadStream, createWriteStream } = require('fs');

const IP = ['89.123.1.41', '176.212.24.22'];

const readStream = createReadStream('./access.log', 'utf8');
const writes = IP.map((ip) => ({
  ip, stream: createWriteStream(`./${ip}_requests.log`, { flags: 'a', encoding: 'utf8' }),
}));

let snip = '';
readStream.on('data', (chunk) => {
  const string = (snip + chunk.toString()).match(/^(.*)$/gm);
  snip = string.pop();
  writes.forEach(({ ip, stream }) => {
    const regexp = new RegExp(ip.toString().replaceAll('.', '\.'), 'gm');
    stream.write(`\n${string.filter(str => regexp.test(str)).join('\n')}`);
  });
});

readStream.on('end', () => console.log(green('Files creating finished')));
readStream.on('error', () => console.log(red(err)));

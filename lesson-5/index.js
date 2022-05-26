const { createServer } = require("http");
const { join } = require('path');
const { createReadStream, readdir, stat, readFile } = require('fs');
const { promisify } = require('util');

const readDir = promisify(readdir);
const lstat = promisify(stat);

const html = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Folder navigator</title>
</head>
<body>
  <div id="content">
    ${content}
  </div>
</body>
</html>`;

const link = (name, path) => `<a href="${path}">${name}</a><br>`;

const text = (text, path) => `<div style="width: 400px; height: 400px"> ${text} ${link('close', path)}</div>`;

const img = (img, path) => `
<div style="width: 400px; height: 400px">
  <img src="${img}" alt="img">${link('close', path)}
</div>`;

const rootDir = __dirname.split('\\')[0];

const server = createServer(({ method, url }, res) => {
  async function getPath() {
    if (method === "GET") {
      if (url === '/') {
        const links = await readDir(rootDir + '\\');
        res.end(html(links.map(path => `${link(path, '/' + path)}`).join(' ')));
      } else if (url === '/favicon.ico') {
        //
      } else {
        const path = url.split('/').map(path => decodeURI(path)).splice(1);

        const walk = async (path) => {
          const links = await readDir(join(rootDir, path.join('/')));

          if (path.length) links.unshift('...');

          res.end(html(links.map(name => {
            const nPath = [...path].filter(Boolean);
            name === '...' ? nPath.pop() : nPath.push(name);
            return `${link(name, `/${nPath.join('/')}`)}`
          }).join(' ')));
        }

        await lstat(join(rootDir, path.join('/')), (err, stats) => {
          if (err) {
            console.log(err);
            return;
          }

          if (stats.isFile()) {
            const nPath = [...path].filter(Boolean);
            const file = nPath.pop();
            const fileA = file.split('.');
            const fileType = fileA[fileA.length - 1];
            if (['jpg', 'jpeg', 'png'].includes(fileType)) {
              readFile(join(rootDir, path.join('/')), (err, data) => res.end(html(
                img(`data:image/jpeg;base64,${Buffer.from(data).toString('base64')}`, `/${nPath.join('/')}`)
              )));
            } else {
              const readStream = createReadStream(join(rootDir, path.join('/')), 'utf8');
              readStream.on('data', (chunk) => res.end(html(text(chunk, `/${nPath.join('/')}`))));
            }
          } else {
            walk(path)
          }
        });
      }
    }
  }
  getPath();
});

server.listen(3000);
const socket = require('socket.io');
const { createServer } = require('http');
const { createReadStream } = require('fs');
const { join } = require('path');
const { uniqueNamesGenerator, starWars, colors } = require('unique-names-generator');

const createUser = () => ({
  name: uniqueNamesGenerator({ dictionaries: [starWars]}),
  color: uniqueNamesGenerator({ dictionaries: [colors]}),
});

let users = [];

const server = createServer((req, res) => {
  const indexPath = join(__dirname, "./index.html");
  const readStream = createReadStream(indexPath);

  readStream.pipe(res);
});

socket(server).on('connection', (client) => {
  users.push({ ...createUser(), id: client.id });
  const getUser = () => users.find(({ id }) => id === client.id);
  const getConnectData = (data) => ({
    ...getUser(),
    event: 'подключился',
    count: users.length,
    ...data
  })

  client.broadcast.emit('newConnect', getConnectData({}));
  client.emit('newConnect', getConnectData({}));

  client.on('newMessage', (data) => {
    client.broadcast.emit('newMessage', { ...getUser(), ...data });
    client.emit('newMessage', { ...getUser(), ...data });
  });

  client.on('disconnect', () => {
    const user = getUser();
    users = users.filter(({ id }) => id !== client.id);
    client.broadcast.emit('newConnect', getConnectData({ ...user, event: 'отключился' }));
    client.emit('newConnect', getConnectData({ ...user, event: 'отключился' }));
  });

  client.on('reconnect', () => {
    client.broadcast.emit('newConnect', getConnectData({ event: 'переподключился' }));
    client.emit('newConnect', getConnectData({ event: 'переподключился' }));
  });
});

server.listen(3000);
#!/usr/bin/env node

const { join } = require('path');
const { green, red } = require('colors/safe');
const { createReadStream, createWriteStream, lstatSync, readdirSync } = require('fs');
const inquirer = require('inquirer');

const main = async () => {
  let input = __dirname;
  do {
    input = await inquirer
      .prompt([{
        name: 'file',
        type: 'list',
        message: 'Выберите файл логов: ',
        choices: ['..', ...readdirSync(input)],
      }])
      .then(({ file }) => join(input, file));
  } while (lstatSync(input).isDirectory())

  const readStream = createReadStream(input, 'utf8');

  const search = await inquirer
    .prompt([{
      name: 'search',
      message: 'Введите строку поиска: '
    }])
    .then(({ search }) => search);

  let output = __dirname;
  let choose = true;
  do {
    output = await inquirer
      .prompt([{
        name: 'file',
        type: 'list',
        message: 'Выберите путь сохранения: ',
        choices: [
          '..',
          ...readdirSync(output).filter(path => lstatSync(`${output}/${path}`).isDirectory()),
          'Сохранить здесь'
        ]
      }])
      .then(({ file }) => {
        if (file === 'Сохранить здесь') {
          choose = false;
          return output;
        }
        return join(output, file);
      });
  } while (choose)

  const file = await inquirer
    .prompt([{
      name: 'name',
      message: 'Введите название файла для сохранения: '
    }])
    .then(({ name }) => name);

  const writeStream = createWriteStream(`${output}/${file}`, { flags: 'a', encoding: 'utf8' });

  let snip = '';
  readStream.on('data', (chunk) => {
    const string = (snip + chunk.toString()).match(/^(.*)$/gm);
    snip = string.pop();
    const regexp = new RegExp(search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), 'gm');
    writeStream.write(`\n${string.filter(str => regexp.test(str)).join('\n')}`);
  });

  readStream.on('end', () => console.log(green('Files creating finished')));
  readStream.on('error', () => console.log(red(err)));
}

main();




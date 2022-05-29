const { join } = require('path');
const { lstatSync, readdirSync } = require('fs');
const inquirer = require('inquirer');
const { Worker } = require('worker_threads');

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

  const findInLogs = (options) => {
    return new Promise((resolve, reject) => {
      const worker = new Worker("./worker.js", {
        workerData: options,
      });

      worker.on("Find finished", resolve);
      worker.on("messageerror", reject);
    });
  };

  const result = await findInLogs({
    search, input, output: `${output}/${file}`,
  });

  console.log(result);
}

main();
const { green, red, yellow } = require("colors/safe");
const process = require('process');

const isPrime = n => n > 1 && ![...Array(n).keys()].find(v => v > 1 && !(n % v));
const getPrime = (from, to) => [...Array(+to + 1).keys()].filter(value => +from <= value && isPrime(value));
const setColor = (val, idx) => !((idx - 1) % 3) ? yellow(val) : (!((idx + 1) % 3) ? red(val) : green(val));

const [,,from,to] = process.argv;

console.log(
  isNaN(+from) || isNaN(+to)
    ? red('Ошибка, аргумент, переданный при запуске, не считается числом!')
    : getPrime(from, to).map(setColor).join(' ') || red('Простых чисел в диапазоне нет')
);

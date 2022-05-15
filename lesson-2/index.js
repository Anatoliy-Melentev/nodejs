const { green, red, yellow, blue } = require("colors/safe");
const process = require('process');
const EventEmitter = require('events');

const emitter = new EventEmitter();

const regexp = /^([0-2]?[0-9]+)\-([0-3]?[0-9]+)\-([0-1]?[0-9]+)\-([2-9]?[0-9]?[0-9]+[0-9]+)$/;
const creatYear = year => year.length === 2 ? `20${year}` : `${year}`;
const addNull = number => number.length < 2 ? `0${number}` : `${number}`;

const timers = process.argv.splice(2)
  .map(arg => regexp.test(arg) && arg.match(regexp).splice(1, 4)).filter(Boolean)
  .map(([h, d, m, y]) => Date.parse(`${creatYear(y)}-${addNull(m)}-${addNull(d)}T${addNull(h)}:00:00`))
  .filter(date => date > new Date().getTime());

if (!timers.length) {
  console.error(red('Время для таймер указано не корректно, либо указана истекшая дата.'));
  return;
}

emitter.setMaxListeners(timers.length);

timers.forEach((timer, idx) => emitter.on(`${timer}-${idx}`, time => console.log(time)));

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const getDate = time => new Date(Number(time));
const createTimerName = time => ['getHours', 'getDate', 'getMonth', 'getFullYear']
    .map(fn => addNull(`${getDate(time)[fn]() + (fn === 'getMonth' ? 1 : 0)}`)).join('-')

const between = (start, it, end) => start < it && it < end;
const declinationOfNumber = (number, name) => {
  const idx = [
    num => between(4, Math.abs(num) % 100, 21),
    num => between(1, Math.abs(num) % 10, 5),
    num => Math.abs(num) % 10 === 1,
  ].findIndex(fn => fn(number));

  return `${addNull(number)} ${name[idx === -1 ? 2 : 2 - idx]}`;
};

const createTimer = time => [
    [getDate(time).getUTCFullYear() - 1970, ['год', 'года', 'лет']],
    [getDate(time).getUTCMonth(), ['месяц', 'месяца', 'месяцев']],
    [getDate(time).getUTCDate() - 1, ['день', 'дня', 'дней']],
    [getDate(time).getUTCHours(), ['час', 'часа', 'часов']],
    [getDate(time).getUTCMinutes(), ['минута', 'минуты', 'минут']],
    [getDate(time).getUTCSeconds(), ['секунда', 'секунды', 'секунд']],
  ].map(([value, name]) => declinationOfNumber(value, name)).join(' ');

const setColor = (val, idx) => !((idx - 1) % 3) ? yellow(val) : (!((idx + 1) % 3) ? red(val) : green(val));

const run = async () => {
  const times = await delay(1000).then(() => timers.filter(date => date > new Date().getTime()));
  const closeEvents = emitter.eventNames().filter(name => !+times.includes(+name.split('-')[0]));

  if (closeEvents.length) {
    closeEvents.forEach(name => emitter.emit(name, blue(
      `Таймер "${createTimerName(name.split('-')[0])}" завершил работу!`
    )));
    emitter.removeAllListeners(closeEvents);
  }

  if (times.length) {
    times.forEach((timer, idx) => emitter.emit(`${timer}-${idx}`, setColor(
      `Таймеру "${createTimerName(timer)}" осталось работать: ${createTimer(timer - new Date().getTime())}`, idx)
    ));

    run();
  }

  return false;
};
run();


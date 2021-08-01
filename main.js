/* Page */

const deviceWidth = document.documentElement.clientWidth;
let main = document.querySelector('.main');
let pages = document.querySelectorAll('.page');
let menu = document.querySelector('.menu');
let currentMenu = menu.children[0];

const clickMenu = (menu, index) => {
    if (menu.classList.contains('selected')) return;

    currentMenu.classList.remove('selected');
    menu.classList.add('selected');
    currentMenu = menu;

    movePageWidthIndex(index);
}

const movePageWidthIndex = index => {
    main.style.left = `${-deviceWidth * index}px`;
}

for (let i = 0; i < menu.children.length; i++) {
    menu.children[i].addEventListener('click', event => clickMenu(menu.children[i], i));
}


/* Clock */

let hands = document.querySelector('.hand').children;
let date = document.querySelector('.date');
let time = document.querySelector('.time');

const rotateElem = (elem, deg) => {
    elem.style.transform = `rotate(${deg}deg)`;
}

const updateHands = now => {
    rotateElem(hands[0], now.getHours() % 12 * 30 + now.getMinutes() * 0.5);
    rotateElem(hands[1], now.getMinutes() * 6);
    rotateElem(hands[2], now.getSeconds() * 6);
}

const updateTime = now => {
    let dates = [now.getFullYear(), now.getMonth() + 1, now.getDate()];
    date.textContent = dates.map(fillDigit).join('/');

    let times = [now.getHours(), now.getMinutes(), now.getSeconds()];
    time.textContent = times.map(fillDigit).join(':');
}

const fillDigit = str => {
    if (str < 10) return '0' + str;
    else return str;
}

const updateClock = () => {
    let now = new Date();
    updateHands(now);
    updateTime(now);
}

const startClock = () => {
    setInterval(updateClock, 1000);
}

async function testSharp() {
    async function* genArr() {
        for (let i of [350, 355, 360, 5, 10]) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            yield i;
        }
    }

    let arr = genArr();
    for await (let i of arr) {
        rotateElem(hands[2], i);
    }
}


/* Alarm */

const DIAL_LIMITS = { meridiem: 1, hour: 11, minute: 59 };
const DIAL_HEIGHT = 64;

let alarms = [];
let dialValues = { meridiem: 0, hour: 0, minute: 0 };
let selectedDays = new Set();

let alarmList = document.querySelector('.alarm_list');
let alarmAddButton = document.querySelector('.alarm_add');
let alarmModal = document.querySelector('.alarm_modal');
let dials = document.querySelectorAll('.time_selector > div');
let days = document.querySelectorAll('.days li');
let repeatBox = document.querySelector('.repeat');

const openAlarmModal = () => {
    alarmModal.classList.add('opened');
}

const closeAlarmModal = () => {
    alarmModal.classList.remove('opened');
    setTimeout(resetAlarmModal, 400);
}

const resetAlarmModal = () => {
    resetDialValues();
    selectedDays.clear();
    dials.forEach(item => item.style.top = '');
    days.forEach(item => item.classList.remove('selected'));
    repeatBox.checked = false;
}

const resetDialValues = () => {
    dialValues.meridiem = 0;
    dialValues.hour = 0;
    dialValues.minute = 0;
}

const addAlarm = () => {
    let newAlarm = {
        hour: -(12 * (dialValues.meridiem / 64) + (dialValues.hour / 64)),
        minute: -dialValues.minute / 64,
        days: [],
        isRepeat: repeatBox.checked
    }
    selectedDays.forEach(day => newAlarm.days.push(day));

    alarms.push(newAlarm);

    return newAlarm;
}

const addAlarmItem = alarm => {
    let alarmItem = document.createElement('li');

    alarmItem.textContent = `${
        alarm.hour < 10 ? '0' + alarm.hour : alarm.hour}:${
        alarm.minute < 10 ? '0' + alarm.minute : alarm.minute}
        [${alarm.days.join(', ')}]
        ${alarm.isRepeat ? '반복' : '한 번'}`;

    alarmList.append(alarmItem);
}


dials.forEach(dial => {
    let dialName = dial.className;

    dial.onpointerdown = downEvent => {
        dial.classList.add('no-transition');
        let shiftY = downEvent.clientY - dialValues[dialName];

        document.onpointermove = moveEvent => {
            dialValues[dialName] = Math.max(Math.min(moveEvent.clientY - shiftY, 0), -DIAL_LIMITS[dialName] * DIAL_HEIGHT);
            dial.style.top = moveEvent.clientY - shiftY + 'px';
        }

        document.onpointerup = () => {
            dial.classList.remove('no-transition');

            dialValues[dialName] = Math.round(dialValues[dialName] / DIAL_HEIGHT) * DIAL_HEIGHT;
            dial.style.top = dialValues[dialName] + 'px';

            document.onpointermove = null;
            document.onpointerup = null;
        }
    }
});

days.forEach(day => day.onclick = () => {
    day.classList.toggle('selected');
    selectedDays.has(day.textContent)
        ? selectedDays.delete(day.textContent) : selectedDays.add(day.textContent);
});


alarmAddButton.addEventListener('click', openAlarmModal);
alarmModal.querySelector('.cancel').onclick = closeAlarmModal;
alarmModal.querySelector('.ok').onclick = () => {
    addAlarmItem(addAlarm());
    closeAlarmModal();
}


// prevent default events
document.ondragstart = () => false;
document.onselectstart = () => false;
document.oncontextmenu = () => false;

updateClock();
startClock();
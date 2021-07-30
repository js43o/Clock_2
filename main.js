const DAY_MILLISECOND = 1000 * 60 * 60 * 24;



/* Page */

const deviceWidth = document.documentElement.clientWidth;
let main = document.querySelector('.main');
let pages = document.querySelectorAll('.page');
let menu = document.querySelector('.menu');
let currentMenu = menu.children[0];

const clickMenu = (menu, index) => {
    if (menu.classList.contains('active')) return;

    currentMenu.classList.remove('active');
    menu.classList.add('active');
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
    let dates = [ now.getFullYear(), now.getMonth() + 1, now.getDate() ];
    date.textContent = dates.map(fillDigit).join('/');

    let times = [ now.getHours(), now.getMinutes(), now.getSeconds() ];
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

let alarmList = document.querySelector('.alarm_list');
let alarmAdd = document.querySelector('.alarm_add');
let alarmModal = document.querySelector('.alarm_modal');
let alarms = [];

const addAlarmAction = () => {
    openAlarmModal();
}

const openAlarmModal = () => {
    alarmModal.classList.add('opened');
}

const closeAlarmModal = () => {
    alarmModal.classList.remove('opened');
}


/* Alarm_Modal */

let timeSelectors = document.querySelectorAll('.time_selector');
let dialValues = { meridiem: 0, hour: 0, minute: 0 };
const DIAL_LIMITS = { meridiem: 1, hour: 11, minute: 59 };
const DIAL_HEIGHT = 64;
let isRepeat = false;

for (let timeSelector of timeSelectors) {
    let dial = timeSelector.children[0];
    let dialName = dial.className;
    let pos = dialValues[dialName];

    dial.onpointerdown = downEvent => {
        let shiftY = downEvent.clientY - pos;

        dial.classList.add('no-transition');

        document.onpointermove = moveEvent => {
            pos = Math.max(Math.min(moveEvent.clientY - shiftY, 0), -DIAL_LIMITS[dialName] * DIAL_HEIGHT);
            dial.style.top = moveEvent.clientY - shiftY + 'px';
        }

        document.onpointerup = () => {
            dial.classList.remove('no-transition');

            pos = Math.round(pos / DIAL_HEIGHT) * DIAL_HEIGHT;
            dialValues[dialName] = pos;
            dial.style.top = pos + 'px';

            document.onpointermove = null;
            document.onpointerup = null;
        }
    }
}

let days = document.querySelector('.days');
let selectedDays = [ false, false, false, false, false, false, false ];
const DAYS = [ '일', '월', '화', '수', '목', '금', '토' ];
for (let day of days.children) {
    day.onclick = () => {
        day.classList.toggle('active');
        let index = Array.from(days.children).indexOf(day);
        selectedDays[index] = !selectedDays[index];
    }
}

alarmAdd.addEventListener('click', addAlarmAction);
alarmModal.querySelector('.cancel').onclick = closeAlarmModal;
alarmModal.querySelector('.ok').onclick = () => {

    let newAlarm = {
        hour: -(12 * (dialValues.meridiem / 64) + (dialValues.hour / 64)),
        minute: -dialValues.minute / 64,
        days: [],
        repeat: isRepeat,
    }

    console.log(selectedDays);
    for (let i = 0; i < 7; i++) {
        if (selectedDays[i]) newAlarm.days.push(DAYS[i]);
    }

    alarms.push(newAlarm);

    let alarmLi = document.createElement('li');
    alarmLi.textContent = `${newAlarm.hour < 10 ? '0' + newAlarm.hour : newAlarm.hour}:${
        newAlarm.minute < 10 ? '0' + newAlarm.minute : newAlarm.minute }
    (${newAlarm.days})
    ${newAlarm.isRepeat ? '반복' : '한 번'}`;
    alarmList.append(alarmLi);
}




// prevent default events
document.ondragstart = () => false;
document.onselectstart = () => false;
document.oncontextmenu = () => false;


updateClock();
startClock();
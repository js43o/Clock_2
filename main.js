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

alarmAdd.addEventListener('click', addAlarmAction);

alarmModal.querySelector('.cancel').onclick = closeAlarmModal;

// prevent default events
document.ondragstart = () => false;
document.onselectstart = () => false;
document.oncontextmenu = () => false;


updateClock();
startClock();
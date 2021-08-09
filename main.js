/* Page */

const deviceWidth = document.documentElement.clientWidth;
let pageWrapper = document.querySelector('.page-wrapper');
let pages = document.querySelectorAll('.page section');
let menu = document.querySelector('.menu');
let currentMenu = menu.children[0];

const clickMenu = (menu, index) => {
    if (menu.classList.contains('selected')) return;

    currentMenu.classList.remove('selected');
    menu.classList.add('selected');
    currentMenu = menu;

    movePageWidthIndex(index);
};

const movePageWidthIndex = index => pageWrapper.style.left = `${-deviceWidth * index}px`;

menu.querySelectorAll("div").forEach((item, index) => {
    item.onclick = () => clickMenu(item, index);
});


/* Clock */

let hands = document.querySelector('.clock__hands').children;
let date = document.querySelector('.clock__indicator__date');
let time = document.querySelector('.clock__indicator__time');

const rotateElem = (elem, deg) => elem.style.transform = `rotate(${deg}deg)`;

const updateHands = now => {
    rotateElem(hands[0], now.getHours() % 12 * 30 + now.getMinutes() * 0.5);
    rotateElem(hands[1], now.getMinutes() * 6);
    rotateElem(hands[2], now.getSeconds() * 6);
};

const updateTime = now => {
    let dates = [now.getFullYear(), now.getMonth() + 1, now.getDate()];
    date.textContent = dates.map(fillDigit).join('/');

    let times = [now.getHours(), now.getMinutes(), now.getSeconds()];
    time.textContent = times.map(fillDigit).join(':');
};

const fillDigit = str => str < 10 ? `0${str}` : str;

const updateClock = () => {
    let now = new Date();
    updateHands(now);
    updateTime(now);
};

const startClock = () => setInterval(updateClock, 1000);


/* Alarm */

const DIAL_LIMITS = { meridiem: 1, hour: 11, minute: 59 };
const DIAL_HEIGHT = 77;
const DAYS_NAME = ['일', '월', '화', '수', '목', '금', '토'];

let alarms = [];
let dialValues = { meridiem: 0, hour: 0, minute: 0 };
let selectedDays = new Set();
let currentAlarm;

let alarmList = document.querySelector('.alarm-list');
let alarmAddButton = document.querySelector('.alarm-adder');
let alarmModal = document.querySelector('.alarm-modal');
let dials = document.querySelectorAll('.time-selector');
let dayItems = document.querySelectorAll('.day-selector li');
let alarmName = document.querySelector('input#alarm-name');
let isRepeated = document.querySelector('input#alarm-repeated');
let isEnabled = document.querySelector('input#alarm-enabled');

const openAlarmModal = () => {
    if (alarmModal.classList.contains('opened')) return;
    alarmModal.classList.add('opened');
};

const closeAlarmModal = () => {
    if (!alarmModal.classList.contains('opened')) return;
    alarmModal.classList.remove('opened');
};

const resetAlarmModal = () => {
    setAlarmModal({
        enable: true,
        meridiem: 0,
        hour: 0,
        minute: 0,
        days: [],
        name: '',
        repeat: false
    });
    selectedDays.clear();
    dayItems.forEach(item => item.classList.remove('selected'));
};

const setAlarmModal = alarm => {
    setDialValues(alarm.meridiem, alarm.hour, alarm.minute);
    alarm.days.forEach(day => selectedDays.add(day));

    dials.forEach(dial => dial.style.top = dialValues[dial.className.split(' ')[1]] + 'px');
    dayItems.forEach(item => alarm.days.includes(item.textContent) ? item.classList.add('selected') : '');
    alarmName.value = alarm.name;
    isEnabled.checked = alarm.enable;
    isRepeated.checked = alarm.repeat;
}

const setDialValues = (mer, h, m) => {
    dialValues.meridiem = -mer * DIAL_HEIGHT;
    dialValues.hour = -(h % 12) * DIAL_HEIGHT;
    dialValues.minute = -m * DIAL_HEIGHT;
};

const addAlarm = () => {
    let newAlarm = {};
    alarms.push(newAlarm);

    return newAlarm;
};

const setAlarm = alarm => {
    alarm.checkable = true;    // is detected by alarm checker
    alarm.meridiem = -dialValues.meridiem / DIAL_HEIGHT;
    alarm.hour = -(12 * (dialValues.meridiem / DIAL_HEIGHT) + (dialValues.hour / DIAL_HEIGHT));
    alarm.minute = -dialValues.minute / DIAL_HEIGHT;
    alarm.name = alarmName.value;
    alarm.enable = isEnabled.checked;
    alarm.repeat = isRepeated.checked;
    alarm.days = [];
    selectedDays.forEach(day => alarm.days.push(day));
}

const addAlarmItem = alarm => {
    let alarmItem = document.createElement('li');
    alarmItem.className = 'alarm-item';

    if (!alarm.enable) alarmItem.classList.add('disabled');
    if (alarm.repeat) alarmItem.classList.add('repeat');


    let alarmHTML = `
    <div>${alarm.name}</div>
    <div style="font-size: 32px; font-family: 'Inconsolata', monospace">${
        alarm.hour < 10 ? '0' + alarm.hour : alarm.hour}:${
        alarm.minute < 10 ? '0' + alarm.minute : alarm.minute}</div>
        <ul class="week-list">`;

    DAYS_NAME.forEach(day => {
        if (alarm.days.includes(day)) alarmHTML += `<li class="selected">${day}</li>`;
        else alarmHTML += `<li class="no-selected">${day}</li>`;
    })

    alarmHTML += `</ul>${alarm.repeat ? '<i class="fas fa-sync-alt"></i>' : ''}`;


    alarmItem.insertAdjacentHTML('beforeend', alarmHTML);

    alarmList.lastElementChild.before(alarmItem);
};

const updateAlarmItems = () => {
    let alarmItems = alarmList.querySelectorAll('.alarm-item');

    alarmItems.forEach(item => item.remove());
    alarms.forEach(alarm => addAlarmItem(alarm));

    alarmItems = alarmList.querySelectorAll('.alarm-item'); // get items again

    alarmItems.forEach((item, index) => 
        item.onpointerdown = () => {
            item.classList.add('holded');
            let timer = setTimeout(() => removeAlarmItem(item, index), 800);

            document.onpointerup = () => {
                if (timer) {
                    clearTimeout(timer);
                    editAlarmItem(index);
                }
                item.classList.remove('holded');
                document.onpointerup = null;
            };
        }
    );
};

const editAlarmItem = index => {
    currentAlarm = alarms[index];
    setAlarmModal(currentAlarm);
    openAlarmModal();
};

const removeAlarmItem = (item, index) => {
    if (confirm('삭제하시겠습니까?')) {
        item.remove();
        alarms.splice(index, 1);
    }
    updateAlarmItems();
};

const compareDays = (a, b) => {
    if (DAYS_NAME.indexOf(a) < DAYS_NAME.indexOf(b)) return -1;
    else if (DAYS_NAME.indexOf(a) > DAYS_NAME.indexOf(b)) return 1;
    else return 0;
};

const checkAlarm = () => {
    let today = new Date();

    alarms.forEach(alarm => {
        if (!alarm.enable ||
            !alarm.checkable ||
            alarm.hour !== today.getHours() ||
            alarm.minute !== today.getMinutes() ||
            !alarm.days.includes(DAYS_NAME[today.getDay()])) return;

        playAlarm(alarm);
    });
};

const playAlarm = alarm => {
    alert(`알람! ${alarm.name}`);

    alarm.checkable = false;
    setTimeout(() => alarm.checkable = true, 60000);

    if (!alarm.repeat) {
        alarm.enable = false;
        updateAlarmItems();
    }
}

// dial dragging event
dials.forEach(dial => {
    let dialName = dial.className.split(' ')[1];

    dial.onpointerdown = downEvent => {
        dial.classList.add('no-transition');
        let shiftY = downEvent.clientY - dialValues[dialName];
        let moveValue = 0;
        let t = Date.now();

        document.onpointermove = moveEvent => {
            dial.style.top = moveEvent.clientY - shiftY + 'px';
        }

        document.onpointerup = upEvent => {
            dial.classList.remove('no-transition');
            moveValue = upEvent.clientY - downEvent.clientY;

            let moveSpeed = Math.abs((downEvent.clientY - upEvent.clientY) / (Date.now() - t));
            if (moveSpeed > 1) moveValue = moveValue * moveSpeed * 1.2;

            dialValues[dialName] = boundDialValue(dialValues[dialName] + Math.round(moveValue / DIAL_HEIGHT) * DIAL_HEIGHT, dialName);
            dial.style.top = dialValues[dialName] + 'px';

            document.onpointermove = null;
            document.onpointerup = null;
        }
    }
});

const boundDialValue = (movement, dialName) => Math.max(Math.min(movement, 0), -DIAL_LIMITS[dialName] * DIAL_HEIGHT);

dayItems.forEach(item => item.onclick = () => {
    item.classList.toggle('selected');
    selectedDays.has(item.textContent)
        ? selectedDays.delete(item.textContent) : selectedDays.add(item.textContent);
});


alarmAddButton.onclick = () => {
    currentAlarm = null;
    resetAlarmModal();
    openAlarmModal();
};
alarmModal.querySelector('.cancel').onclick = closeAlarmModal;
alarmModal.querySelector('.ok').onclick = () => {
    if (!currentAlarm) currentAlarm = addAlarm();
    setAlarm(currentAlarm);
    updateAlarmItems();
    closeAlarmModal();
};


// prevent default events
document.ondragstart = () => false;
document.onselectstart = () => false;
document.oncontextmenu = () => false;

updateClock();
startClock();
let alarmSchedule = setInterval(checkAlarm, 5000);


/* Stopwatch */

let stopwatchSchedule;
let stopwatchMS = 0;
let stopwatchDisplay = document.querySelector('.stopwatch-time');
let buttons = document.querySelector('.stopwatch-buttons');
let buttonStart = buttons.querySelector('.start');
let buttonStop = buttons.querySelector('.stop');
let buttonReset = buttons.querySelector('.reset');

const buttonModeStart = () => {
    buttonStop.style.display = 'none';
    buttonStart.style.display = 'block';
};

const showButtonStop = () => {
    buttonStart.style.display = 'none';
    buttonStop.style.display = 'block';
};

const updateStopwatch = () => {
    stopwatchMS += 10;
    stopwatchDisplay.textContent = millisecondToStr(stopwatchMS);
};

const clearTime = () => {
    stopwatchMS = 0;
    stopwatchDisplay.textContent = '00:00.00';
};

const millisecondToStr = ms => {
    let minute = fillDigit(Math.floor(ms / 60000));
    let second = fillDigit(Math.floor((ms / 1000) % 60));
    let miniSecond = fillDigit(Math.floor((ms / 10) % 100));
    return `${minute}:${second}.${miniSecond}`;
};

const startStopwatch = () => {
    showButtonStop();
    stopwatchSchedule = setInterval(updateStopwatch, 10);
};

const stopStopwatch = () => {
    buttonModeStart();
    clearInterval(stopwatchSchedule);
};

const resetStopwatch = () => {
    buttonModeStart();
    clearInterval(stopwatchSchedule);
    clearTime();
};

buttonStart.onclick = startStopwatch;
buttonStop.onclick = stopStopwatch;
buttonReset.onclick = resetStopwatch;
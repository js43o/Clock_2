/* Page */

const pageWrapper = document.querySelector('.page-wrapper');
const pages = document.querySelectorAll('.page section');
const menu = document.querySelector('.menu');
let currentMenu = menu.children[0];
let currentMenuIndex = 0;
let resizeTimerId;

const getDeviceWidth = () => document.documentElement.clientWidth;

const movePageWithIndex = index =>
    pageWrapper.style.transform = `translateX(${-getDeviceWidth() * index}px)`;

const clickMenu = (menu, index) => {
    if (menu.classList.contains('selected')) return;

    currentMenu.classList.remove('selected');
    menu.classList.add('selected');
    currentMenu = menu;
    currentMenuIndex = index;

    movePageWithIndex(index);
};

menu.querySelectorAll("div").forEach((item, index) => {
    item.onclick = () => clickMenu(item, index);
});

window.onresize = () => {
    clearTimeout(resizeTimerId);
    resizeTimerId = setTimeout(() => movePageWithIndex(currentMenuIndex), 100);
}


/* Dials */

const getDialName = dial => dial.className.split(' ')[1];

const addDraggingEventToDials = (dialElems, dialValues, dialLimiter) => {
    dialElems.forEach(dialElem => {
        let dial = getDialName(dialElem);

        const pointerDown = downEvent => {
            dialElem.classList.add('no-transition');
            let shiftY = downEvent.clientY - dialValues[dial];
            let moveValue = 0;
            let t = Date.now();

            const pointerMove = moveEvent => dialElem.style.top = `${moveEvent.clientY - shiftY}px`;

            const pointerUp = upEvent => {
                dialElem.classList.remove('no-transition');
                moveValue = upEvent.clientY - downEvent.clientY;

                let moveSpeed = Math.abs((downEvent.clientY - upEvent.clientY) / (Date.now() - t));
                moveValue = moveSpeed > 1 ? moveValue * moveSpeed * 1.2 : moveValue;

                dialValues[dial] = boundDialValue(dial, dialLimiter,
                    dialValues[dial] + Math.round(moveValue / DIAL_HEIGHT) * DIAL_HEIGHT);
                dialElem.style.top = `${dialValues[dial]}px`;

                document.removeEventListener('pointermove', pointerMove);
                document.removeEventListener('pointerup', pointerUp);
            }

            document.addEventListener('pointermove', pointerMove);
            document.addEventListener('pointerup', pointerUp);
        }

        dialElem.addEventListener('pointerdown', pointerDown);
    });
};

const boundDialValue = (dialName, dialLimiter, movement) =>
    Math.max(Math.min(movement, 0), -dialLimiter[dialName] * DIAL_HEIGHT);

const millisecondToTimes = ms => {
    const times = {};
    times.hour = Math.floor((ms / (1000 * 60 * 60)) % 60);
    times.minute = Math.floor((ms / (1000 * 60)) % 60);
    times.second = Math.floor((ms / 1000) % 60);
    times.miniSecond = Math.floor((ms / 10) % 100);

    return times;
};

const getMsByTimerDial = () => {
    let hour = -timerDialValues.hour / DIAL_HEIGHT;
    let minute = -timerDialValues.minute / DIAL_HEIGHT;
    let second = -timerDialValues.second / DIAL_HEIGHT;

    return (hour * 60 * 60 + minute * 60 + second) * 1000;
};

const resetDialValues = dialValues => {
    for (let key of Object.keys(dialValues)) {
        dialValues[key] = 0;
    }
    return dialValues;
};

const moveDialsByDialValues = (dialElems, dialValues) => {
    dialElems.forEach(dialElem => {
        let dial = getDialName(dialElem);
        dialElem.style.top = `-${dialValues[dial] * DIAL_HEIGHT}px`;
    });
};

const lockDials = dialWrapper => dialWrapper.classList.add('locked');
const unlockDials = dialWrapper => dialWrapper.classList.remove('locked');


/* Clock */

const scales = document.querySelectorAll('.clock__scale > div');
const numberWrappers = document.querySelectorAll('.clock__number > div');
const numbers = document.querySelectorAll('.clock__number > div > div');
const hands = document.querySelector('.clock__hands').children;
const date = document.querySelector('.clock__indicator__date');
const time = document.querySelector('.clock__indicator__time');

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

scales.forEach((scale, index) => {
    scale.style.transform = `rotate(${6 * index}deg)`;
});

numberWrappers.forEach((wrapper, index) => {
    wrapper.style.transform = `rotate(${30 * index}deg)`;
});

numbers.forEach((number, index) => {
    number.style.transform = `rotate(${-30 * index}deg)`;
});



/* Alarm */

const ALARM_DIAL_LIMITS = { meridiem: 1, hour: 11, minute: 59 };
const DIAL_HEIGHT = 77;
const DAYS_NAME = ['일', '월', '화', '수', '목', '금', '토'];
const ALARMS_LOCAL = "alarms_local";

let alarmSchedule;
let alarms = [];
let alarmDialValues = { meridiem: 0, hour: 0, minute: 0 };
let selectedDays = new Set();
let currentAlarm;
let alarmEditMode = 'ADD';

const alarmPage = document.querySelector('.page__alarm');
const alarmList = document.querySelector('.alarm-list');
const alarmAddButton = document.querySelector('.alarm-adder');
const alarmModal = document.querySelector('.alarm-modal');
const alarmDials = document.querySelectorAll('.alarm-modal .time-selector');
const dayItems = document.querySelectorAll('.day-selector li');
const alarmName = document.querySelector('input#alarm-name');
const isRepeated = document.querySelector('input#alarm-repeated');
const isEnabled = document.querySelector('input#alarm-enabled');

class Alarm {
    constructor(name, enable, checkable, repeat, meridiem, hour, minute, days) {
        this.name = name;
        this.enable = enable;
        this.checkable = checkable;
        this.repeat = repeat;
        this.meridiem = meridiem;
        this.hour = hour;
        this.minute = minute;
        this.days = days;
    }
}

const getAlarmItem = alarm => alarmList.children[alarms.indexOf(alarm)];

const openAlarmModal = () => {
    if (alarmModal.classList.contains('opened')) return;
    alarmModal.classList.add('opened');
};

const closeAlarmModal = () => {
    if (!alarmModal.classList.contains('opened')) return;
    alarmModal.classList.remove('opened');
};

const resetAlarmModal = () => {
    setAlarmModal(new Alarm('', true, true, false, 0, 0, 0, []));
};

const setAlarmModal = alarm => {
    setAlarmDialValues(alarm.meridiem, alarm.hour, alarm.minute);
    alarmDials.forEach(dial => dial.style.top = alarmDialValues[dial.className.split(' ')[1]] + 'px');

    selectedDays.clear();
    alarm.days.forEach(day => selectedDays.add(day));
    dayItems.forEach(item => alarm.days.includes(item.textContent) ? item.classList.add('selected') : item.classList.remove('selected'));
    
    alarmName.value = alarm.name;
    isEnabled.checked = alarm.enable;
    isRepeated.checked = alarm.repeat;
};

const setAlarmDialValues = (mer, h, m) => {
    alarmDialValues.meridiem = -mer * DIAL_HEIGHT;
    alarmDialValues.hour = -(h % 12) * DIAL_HEIGHT;
    alarmDialValues.minute = -m * DIAL_HEIGHT;
};

const addAlarm = () => {
    const alarm = new Alarm('', true, true, false, 0, 0, 0, []);
    alarms.push(alarm);

    return alarm;
};

const setAlarm = alarm => {
    alarm.name = alarmName.value;
    alarm.enable = isEnabled.checked;
    alarm.checkable = true;    // to be detected by alarm checker again
    alarm.repeat = isRepeated.checked;
    alarm.meridiem = -alarmDialValues.meridiem / DIAL_HEIGHT;
    alarm.hour = -(12 * (alarmDialValues.meridiem / DIAL_HEIGHT) + (alarmDialValues.hour / DIAL_HEIGHT));
    alarm.minute = -alarmDialValues.minute / DIAL_HEIGHT;
    alarm.days = [];
    selectedDays.forEach(day => alarm.days.push(day));
};

const addAlarmItem = alarm => {
    const alarmItem = document.createElement('li');
    alarmItem.className = 'alarm-item';

    setAlarmItem(alarmItem, alarm);
    
    alarmList.lastElementChild.before(alarmItem);
    addEventListenerToAlarmItem(alarmItem, alarm);
};

const setAlarmItem = (alarmItem, alarm) => {
    alarm.enable ? alarmItem.classList.remove('disabled') : alarmItem.classList.add('disabled');
    alarm.repeat ? alarmItem.classList.add('repeat') : alarmItem.classList.remove('repeat');

    let alarmHTML = `
    <div>${alarm.name}</div>
    <div style="font-size: 32px; font-family: 'Inconsolata', monospace">${
        alarm.hour < 10 ? '0' + alarm.hour : alarm.hour}:${
        alarm.minute < 10 ? '0' + alarm.minute : alarm.minute}</div>
        <ul class="week-list">`;
    DAYS_NAME.forEach(day => {
        alarmHTML += alarm.days.includes(day) ?
            `<li class="selected">${day}</li>` : `<li class="no-selected">${day}</li>`;
    });
    alarmHTML += `</ul>${alarm.repeat ? '<i class="fas fa-sync-alt"></i>' : ''}`;

    alarmItem.innerHTML = '';
    alarmItem.insertAdjacentHTML('beforeend', alarmHTML);
};

const addAlarmItemAction = () => {
    alarmEditMode = 'ADD';
    currentAlarm = null;
    resetAlarmModal();
    openAlarmModal();
};

const editAlarmItemAction = alarm => {
    alarmEditMode = 'EDIT';
    currentAlarm = alarm;
    setAlarmModal(currentAlarm);
    openAlarmModal();
};

const removeAlarmItemAction = (item, alarm) => {
    if (confirm('삭제하시겠습니까?')) removeAlarmItem(item, alarm);
    item.classList.remove('holded');

    document.onpointermove = null;
    document.onpointerup = null;

    saveAlarmStorage();
};

const removeAlarmItem = (item, alarm) => {
    alarms.splice(alarms.indexOf(alarm), 1);
    item.remove();
};

const addEventListenerToAlarmItem = (item, alarm) => {
    item.onpointerdown = downEvent => {
        const originY = downEvent.clientY;
        const originScroll = alarmList.scrollTop;
        const TOUCH_BOUND = 16;

        item.classList.add('holded');
        let openModalTimer = setTimeout(() => removeAlarmItemAction(item, alarm), 600);

        document.onpointermove = moveEvent => {
            alarmList.scrollTop = originScroll - (moveEvent.clientY - originY);

            if (Math.abs(originY - moveEvent.clientY) < TOUCH_BOUND) return;

            clearTimeout(openModalTimer);
            item.classList.remove('holded');
        };

        document.onpointerup = upEvent => {
            clearTimeout(openModalTimer);
            item.classList.remove('holded');

            if (Math.abs(originY - upEvent.clientY) < TOUCH_BOUND) editAlarmItemAction(alarm);

            document.onpointermove = null;
            document.onpointerup = null;
        };
    };
};

const compareDays = (a, b) => {
    if (DAYS_NAME.indexOf(a) < DAYS_NAME.indexOf(b)) return -1;
    else if (DAYS_NAME.indexOf(a) > DAYS_NAME.indexOf(b)) return 1;
    else return 0;
};

const checkAlarm = () => {
    let today = new Date();
    alarms.forEach(alarm => {
        if (!alarm.enable || !alarm.checkable ||
            !alarm.days.includes(DAYS_NAME[today.getDay()]) ||
            alarm.hour !== today.getHours() ||
            alarm.minute !== today.getMinutes()) return;

        playAlarm(alarm);
    });
};

const playAlarm = alarm => {
    alert(`*** 알람 ***\n${alarm.name} - ${alarm.hour}:${alarm.minute}`);

    alarm.checkable = false;
    setTimeout(() => alarm.checkable = true, 60000);

    if (!alarm.repeat) alarm.enable = false;

    setAlarmItem(getAlarmItem(alarm), alarm);
    saveAlarmStorage();
};

const saveAlarmStorage = () => localStorage.setItem(ALARMS_LOCAL, JSON.stringify(alarms));

const loadAlarmStorage = () => {
    alarms = JSON.parse(localStorage.getItem(ALARMS_LOCAL)) || [];
    alarms.forEach(addAlarmItem);
};

const submitAlarmModal = () => {
    if (alarmEditMode === 'ADD') {
        currentAlarm = addAlarm();
        setAlarm(currentAlarm);
        addAlarmItem(currentAlarm);
    } else if (alarmEditMode === 'EDIT') {
        setAlarm(currentAlarm);
        setAlarmItem(getAlarmItem(currentAlarm), currentAlarm);
    }
    saveAlarmStorage();
    closeAlarmModal();
};

addDraggingEventToDials(alarmDials, alarmDialValues, ALARM_DIAL_LIMITS);

dayItems.forEach(item => item.onclick = () => {
    item.classList.toggle('selected');
    selectedDays.has(item.textContent)
        ? selectedDays.delete(item.textContent) : selectedDays.add(item.textContent);
});

alarmAddButton.onclick = addAlarmItemAction;
alarmModal.querySelector('.ok').onclick = submitAlarmModal;
alarmModal.querySelector('.cancel').onclick = closeAlarmModal;


/* Stopwatch */

const stopwatchDisplay = document.querySelector('.page__stopwatch .time');
const stopwatchRecord = document.querySelector('.page__stopwatch .records ul');
const stopwatchStartButton = document.querySelector('.page__stopwatch .buttons .start');
const stopwatchStopButton = document.querySelector('.page__stopwatch .buttons .stop');
const stopwatchRecordButton = document.querySelector('.page__stopwatch .buttons .record');
const stopwatchResetButton = document.querySelector('.page__stopwatch .buttons .reset');

let containerHeight = 0;
let stopwatchSchedule;
let stopwatchStartTime;
let stopwatchMs = 0;
let stopwatchT = 0;
let recordPos = 0;

const stopwatchStartMode = () => {
    stopwatchStopButton.style.display = 'none';
    stopwatchStartButton.style.display = 'block';
    stopwatchRecordButton.classList.add('disabled');
};

const stopwatchStopMode = () => {
    stopwatchStartButton.style.display = 'none';
    stopwatchStopButton.style.display = 'block';
    stopwatchRecordButton.classList.remove('disabled');
};

const updateStopwatch = () => {
    stopwatchT = Date.now() - stopwatchStartTime;
    let times = millisecondToTimes(stopwatchMs + stopwatchT);
    stopwatchDisplay.textContent =
        `${fillDigit(times.minute)}:${fillDigit(times.second)}.${fillDigit(times.miniSecond)}`;
};

const startStopwatch = () => {
    stopwatchStopMode();
    stopwatchStartTime = Date.now();
    stopwatchSchedule = setInterval(updateStopwatch, 20);
    stopwatchRecord.parentElement.classList.add('activated');
};

const stopStopwatch = () => {
    stopwatchStartMode();
    clearInterval(stopwatchSchedule);
    stopwatchMs += stopwatchT;
};

const resetStopwatch = () => {
    stopStopwatch();
    stopwatchMs = 0;
    stopwatchT = 0;

    stopwatchDisplay.textContent = '00:00.00';
    stopwatchRecord.parentElement.classList.remove('activated');
    stopwatchRecord.textContent = '';
    moveRecordToBottom();
};

const addRecord = () => {
    let li = document.createElement('li');
    li.insertAdjacentHTML('beforeend', `<b>${fillDigit(1 + stopwatchRecord.children.length)}
        - </b> ${stopwatchDisplay.textContent}`);
    stopwatchRecord.append(li);
    moveRecordToBottom();
};

const moveRecord = (pos = recordPos) => stopwatchRecord.style.top = pos + 'px';

const moveRecordToBottom = () => {
    containerHeight = stopwatchRecord.parentElement.clientHeight;
    recordPos = containerHeight - stopwatchRecord.clientHeight;
    moveRecord();
};

stopwatchRecord.onpointerdown = downEvent => {
    stopwatchRecord.classList.add('no-transition');
    const originY = downEvent.clientY;
    let moveValue = originY;
    let resultY = 0;

    document.onpointermove = moveEvent => {
        moveValue = originY - moveEvent.clientY;
        resultY = Math.max(Math.min(recordPos - moveValue, 100),
            containerHeight - stopwatchRecord.clientHeight)
        moveRecord(resultY);
    };

    document.onpointerup = () => {
        stopwatchRecord.classList.remove('no-transition');
        recordPos = resultY !== 0 ? resultY : recordPos;

        document.onpointermove = null;
        document.onpointerup = null;
    };
};

stopwatchStartButton.onclick = startStopwatch;
stopwatchStopButton.onclick = stopStopwatch;
stopwatchRecordButton.onclick = addRecord;
stopwatchResetButton.onclick = resetStopwatch;


/* Timer */

const timerDialsWrapper = document.querySelector('.page__timer .time-selector-wrapper');
const timerDials = document.querySelectorAll('.page__timer .time-selector');
const timerStartButton = document.querySelector('.page__timer .buttons .start');
const timerStopButton = document.querySelector('.page__timer .buttons  .stop');
const timerResetButton = document.querySelector('.page__timer .buttons .reset');

const TIMER_DIAL_LIMIT = { hour: 59, minute: 59, second: 59 };
let timerDialValues = { hour: 0, minute: 0, second: 0 };
let timerSchedule;
let timerStartTime;
let timerMs = 0;
let timerT = 0;

const timerStartMode = () => {
    timerStartButton.style.display = 'none';
    timerStopButton.style.display = 'block';
    lockDials(timerDialsWrapper);
};

const timerStopMode = () => {
    timerStartButton.style.display = 'block';
    timerStopButton.style.display = 'none';
};

const startTimer = () => {
    timerStartMode();
    timerStartTime = Date.now();
    timerMs = timerMs <= 0 ? getMsByTimerDial() : timerMs;
    timerSchedule = setInterval(updateTimer, 100);
};

const updateTimer = () => {
    if (timerMs - timerT <= 0) {
        resetTimer();
        alert('타이머 종료');
        return;
    }
    timerT = Date.now() - timerStartTime;

    const times = millisecondToTimes(timerMs - timerT);
    timerDialValues.hour = times.hour;
    timerDialValues.minute = times.minute;
    timerDialValues.second = times.second;

    moveDialsByDialValues(timerDials, timerDialValues);
};

const stopTimer = () => {
    timerStopMode();
    clearInterval(timerSchedule);
    timerMs -= timerT;
};

const resetTimer = () => {
    stopTimer();
    unlockDials(timerDialsWrapper);
    timerMs = 0;
    timerT = 0;
    timerStartButton.classList.add('disabled');

    moveDialsByDialValues(timerDials, resetDialValues(timerDialValues));
};

timerStartButton.onclick = startTimer;
timerStopButton.onclick = stopTimer;
timerResetButton.onclick = resetTimer;

addDraggingEventToDials(timerDials, timerDialValues, TIMER_DIAL_LIMIT);

timerDialsWrapper.onpointerdown = () => {
    const pointerUp = () => {
        timerDialValues.hour === 0 && timerDialValues.minute === 0 && timerDialValues.second === 0 ?
            timerStartButton.classList.add('disabled') : timerStartButton.classList.remove('disabled');

        document.removeEventListener('pointerup', pointerUp);
    };
    document.addEventListener('pointerup', pointerUp);
};


// prevent default events
document.ondragstart = () => false;
document.onselectstart = () => false;
document.oncontextmenu = () => false;

const init = () => {
    updateClock();
    startClock();
    loadAlarmStorage();
    alarmSchedule = setInterval(checkAlarm, 5000);
};

init();
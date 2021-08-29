/* Page */

let pageWrapper = document.querySelector('.page-wrapper');
let pages = document.querySelectorAll('.page section');
let menu = document.querySelector('.menu');
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
    let times = {};
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
}

const resetDialValues = dialValues => {
    for (let key of Object.keys(dialValues)) {
        dialValues[key] = 0;
    }
    return dialValues;
}

const moveDialsByDialValues = (dialElems, dialValues) => {
    dialElems.forEach(dialElem => {
        let dial = getDialName(dialElem);
        dialElem.style.top = `-${dialValues[dial] * DIAL_HEIGHT}px`;
    });
}

const lockDials = dialWrapper => dialWrapper.classList.add('locked');
const unlockDials = dialWrapper => dialWrapper.classList.remove('locked');


/* Clock */

let scales = document.querySelectorAll('.clock__scale > div');
let numberWrappers = document.querySelectorAll('.clock__number > div');
let numbers = document.querySelectorAll('.clock__number > div > div');
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

let alarmPage = document.querySelector('.page__alarm');
let alarmList = document.querySelector('.alarm-list');
let alarmAddButton = document.querySelector('.alarm-adder');
let alarmModal = document.querySelector('.alarm-modal');
let alarmDials = document.querySelectorAll('.alarm-modal .time-selector');
let dayItems = document.querySelectorAll('.day-selector li');
let alarmName = document.querySelector('input#alarm-name');
let isRepeated = document.querySelector('input#alarm-repeated');
let isEnabled = document.querySelector('input#alarm-enabled');

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
    selectedDays.clear();
    dayItems.forEach(item => item.classList.remove('selected'));
};

const setAlarmModal = alarm => {
    setAlarmDialValues(alarm.meridiem, alarm.hour, alarm.minute);
    alarm.days.forEach(day => selectedDays.add(day));

    alarmDials.forEach(dial => dial.style.top = alarmDialValues[dial.className.split(' ')[1]] + 'px');
    dayItems.forEach(item => alarm.days.includes(item.textContent) ? item.classList.add('selected') : '');
    alarmName.value = alarm.name;
    isEnabled.checked = alarm.enable;
    isRepeated.checked = alarm.repeat;
}

const setAlarmDialValues = (mer, h, m) => {
    alarmDialValues.meridiem = -mer * DIAL_HEIGHT;
    alarmDialValues.hour = -(h % 12) * DIAL_HEIGHT;
    alarmDialValues.minute = -m * DIAL_HEIGHT;
};

const addAlarm = () => {
    let alarm = new Alarm('', true, true, false, 0, 0, 0, []);
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
    });

    alarmHTML += `</ul>${alarm.repeat ? '<i class="fas fa-sync-alt"></i>' : ''}`;


    alarmItem.insertAdjacentHTML('beforeend', alarmHTML);

    alarmList.lastElementChild.before(alarmItem);
};

const updateAlarmItems = () => {
    
    saveAlarmStorage();

    let alarmItems = alarmList.querySelectorAll('.alarm-item');

    alarmItems.forEach(item => item.remove());
    alarms.forEach(alarm => addAlarmItem(alarm));

    alarmItems = alarmList.querySelectorAll('.alarm-item'); // get items again
    addEventListenerToAlarmItems(alarmItems);
};

const addEventListenerToAlarmItems = alarmItems => {
    alarmItems.forEach((item, index) => {
        item.onpointerdown = downEvent => {
            let originY = downEvent.clientY;
            let originScroll = alarmList.scrollTop;

            item.classList.add('holded');
            let openModal = setTimeout(() => removeAlarmItem(item, index), 600);

            document.onpointermove = moveEvent => {
                alarmList.scrollTop = originScroll - (moveEvent.clientY - originY);

                if (Math.abs(originY - moveEvent.clientY) < 16) return;

                clearTimeout(openModal);
                item.classList.remove('holded');
            };

            document.onpointerup = upEvent => {
                clearTimeout(openModal);
                item.classList.remove('holded');

                if (Math.abs(originY - upEvent.clientY) < 16) editAlarmItem(index);

                document.onpointermove = null;
                document.onpointerup = null;
            };
        };
    });
}

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
    document.onpointermove = null;
    document.onpointerup = null;

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
        if (!alarm.enable || !alarm.checkable ||
            !alarm.days.includes(DAYS_NAME[today.getDay()]) ||
            alarm.hour !== today.getHours() ||
            alarm.minute !== today.getMinutes()) return;

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
};

const saveAlarmStorage = () => {
    localStorage.setItem(ALARMS_LOCAL, JSON.stringify(alarms));
}

const loadAlarmStorage = () => {
    let res = JSON.parse(localStorage.getItem(ALARMS_LOCAL));
    alarms = res || [];
    updateAlarmItems();
}

addDraggingEventToDials(alarmDials, alarmDialValues, ALARM_DIAL_LIMITS);

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

alarmModal.querySelector('.ok').onclick = () => {
    if (!currentAlarm) currentAlarm = addAlarm();
    setAlarm(currentAlarm);
    updateAlarmItems();
    closeAlarmModal();
};

alarmModal.querySelector('.cancel').onclick = closeAlarmModal;


/* Stopwatch */

let stopwatchDisplay = document.querySelector('.page__stopwatch .time');
let stopwatchRecord = document.querySelector('.page__stopwatch .records ul');
let stopwatchStartButton = document.querySelector('.page__stopwatch .buttons .start');
let stopwatchStopButton = document.querySelector('.page__stopwatch .buttons .stop');
let stopwatchRecordButton = document.querySelector('.page__stopwatch .buttons .record');
let stopwatchResetButton = document.querySelector('.page__stopwatch .buttons .reset');

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
    t = Date.now() - stopwatchStartTime;
    let times = millisecondToTimes(stopwatchMs + t);
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
    stopwatchMs += t;
};

const resetStopwatch = () => {
    stopStopwatch();
    stopwatchMs = 0;
    t = 0;

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
    let originY = downEvent.clientY;
    let moveValue = originY;
    let resultY;

    document.onpointermove = moveEvent => {
        moveValue = originY - moveEvent.clientY;
        resultY = Math.max(Math.min(recordPos - moveValue, 100),
            containerHeight - stopwatchRecord.clientHeight)
        moveRecord(resultY);
    };

    document.onpointerup = () => {
        stopwatchRecord.classList.remove('no-transition');
        recordPos = resultY;

        document.onpointermove = null;
        document.onpointerup = null;
    };
};

stopwatchStartButton.onclick = startStopwatch;
stopwatchStopButton.onclick = stopStopwatch;
stopwatchRecordButton.onclick = addRecord;
stopwatchResetButton.onclick = resetStopwatch;


/* Timer */

let timerDialsWrapper = document.querySelector('.page__timer .time-selector-wrapper');
let timerDials = document.querySelectorAll('.page__timer .time-selector');
let timerStartButton = document.querySelector('.page__timer .buttons .start');
let timerStopButton = document.querySelector('.page__timer .buttons  .stop');
let timerResetButton = document.querySelector('.page__timer .buttons .reset');

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
}

const timerStopMode = () => {
    timerStartButton.style.display = 'block';
    timerStopButton.style.display = 'none';
}

const startTimer = () => {
    timerStartMode();
    timerStartTime = Date.now();
    timerMs = timerMs <= 0 ? getMsByTimerDial() : timerMs;
    timerSchedule = setInterval(updateTimer, 100);
}

const updateTimer = () => {
    if (timerMs - timerT <= 0) {
        resetTimer();
        alert('타이머 종료');
        return;
    }
    timerT = Date.now() - timerStartTime;

    let times = millisecondToTimes(timerMs - timerT);
    timerDialValues.hour = times.hour;
    timerDialValues.minute = times.minute;
    timerDialValues.second = times.second;

    moveDialsByDialValues(timerDials, timerDialValues);
}

const stopTimer = () => {
    timerStopMode();
    clearInterval(timerSchedule);
    timerMs -= timerT;
}

const resetTimer = () => {
    stopTimer();
    unlockDials(timerDialsWrapper);
    timerMs = 0;
    timerT = 0;
    timerStartButton.classList.add('disabled');

    moveDialsByDialValues(timerDials, resetDialValues(timerDialValues));
}

timerStartButton.onclick = startTimer;
timerStopButton.onclick = stopTimer;
timerResetButton.onclick = resetTimer;

addDraggingEventToDials(timerDials, timerDialValues, TIMER_DIAL_LIMIT);

timerDialsWrapper.onpointerdown = () => {
    const pointerUp = () => {
        if (timerDialValues.hour === 0 && timerDialValues.minute === 0 && timerDialValues.second === 0) {
            timerStartButton.classList.add('disabled');
        } else {
            timerStartButton.classList.remove('disabled');
        }
        document.removeEventListener('pointerup', pointerUp);
    };
    document.addEventListener('pointerup', pointerUp);
}


// prevent default events
document.ondragstart = () => false;
document.onselectstart = () => false;
document.oncontextmenu = () => false;

const init = () => {
    updateClock();
    startClock();
    loadAlarmStorage();
    alarmSchedule = setInterval(checkAlarm, 5000);
}

init();
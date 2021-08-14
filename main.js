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
let alarmDialValues = { meridiem: 0, hour: 0, minute: 0 };
let selectedDays = new Set();
let currentAlarm;

let alarmList = document.querySelector('.alarm-list');
let alarmAddButton = document.querySelector('.alarm-adder');
let alarmModal = document.querySelector('.alarm-modal');
let alarmDials = document.querySelectorAll('.alarm-modal .time-selector');
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
    let newAlarm = {};
    alarms.push(newAlarm);

    return newAlarm;
};

const setAlarm = alarm => {
    alarm.checkable = true;    // is detected by alarm checker
    alarm.meridiem = -alarmDialValues.meridiem / DIAL_HEIGHT;
    alarm.hour = -(12 * (alarmDialValues.meridiem / DIAL_HEIGHT) + (alarmDialValues.hour / DIAL_HEIGHT));
    alarm.minute = -alarmDialValues.minute / DIAL_HEIGHT;
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

            item.onpointerup = () => {
                clearTimeout(timer);
                editAlarmItem(index);
                item.classList.remove('holded');

                item.onpointerup = null;
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

const getDialName = dial => dial.className.split(' ')[1];

const addDraggingEventToDials = (dialElems, dialValues) => {
    dialElems.forEach(dialElem => {
        let dial = getDialName(dialElem);

        dialElem.onpointerdown = downEvent => {
            dialElem.classList.add('no-transition');
            let shiftY = downEvent.clientY - dialValues[dial];
            let moveValue = 0;
            let t = Date.now();
    
            document.onpointermove = moveEvent => dialElem.style.top = `${moveEvent.clientY - shiftY}px`;
    
            document.onpointerup = upEvent => {
                dialElem.classList.remove('no-transition');
                moveValue = upEvent.clientY - downEvent.clientY;
    
                let moveSpeed = Math.abs((downEvent.clientY - upEvent.clientY) / (Date.now() - t));
                moveValue = moveSpeed > 1 ? moveValue * moveSpeed * 1.2 : moveValue;
    
                dialValues[dial] = boundDialValue(dialValues[dial] +
                    Math.round(moveValue / DIAL_HEIGHT) * DIAL_HEIGHT, dial);
                dialElem.style.top = `${dialValues[dial]}px`;
    
                document.onpointermove = null;
                document.onpointerup = null;
            }
        }
    });
};

const boundDialValue = (movement, dialName) =>
    Math.max(Math.min(movement, 0), -DIAL_LIMITS[dialName] * DIAL_HEIGHT);

addDraggingEventToDials(alarmDials, alarmDialValues);

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

let stopwatchSchedule;
let stopwatchStartTime;
let stopwatchMs = 0;
let t = 0;
let stopwatchDisplay = document.querySelector('.stopwatch-time');
let stopwatchRecord = document.querySelector('.stopwatch-record ul');
let buttonStart = document.querySelector('.stopwatch-buttons .start');
let buttonStop = document.querySelector('.stopwatch-buttons .stop');
let buttonRecord = document.querySelector('.stopwatch-buttons .record');
let buttonReset = document.querySelector('.stopwatch-buttons .reset');

const showStartMode = () => {
    buttonStop.style.display = 'none';
    buttonStart.style.display = 'block';
    buttonRecord.classList.add('disabled');
};

const showStopMode = () => {
    buttonStart.style.display = 'none';
    buttonStop.style.display = 'block';
    buttonRecord.classList.remove('disabled');
};

const updateStopwatch = () => {
    t = Date.now() - stopwatchStartTime;
    stopwatchDisplay.textContent = millisecondToStr(stopwatchMs + t);
};

const millisecondToStr = ms => {
    let minute = fillDigit(Math.floor(ms / 60000));
    let second = fillDigit(Math.floor((ms / 1000) % 60));
    let miniSecond = fillDigit(Math.floor((ms / 10) % 100));
    return `${minute}:${second}.${miniSecond}`;
};

const startStopwatch = () => {
    showStopMode();
    stopwatchStartTime = Date.now();
    stopwatchSchedule = setInterval(updateStopwatch, 20);
    stopwatchDisplay.classList.add('activated');
};

const stopStopwatch = () => {
    showStartMode();
    clearInterval(stopwatchSchedule);
    stopwatchMs += t;
};

const resetStopwatch = () => {
    stopStopwatch();
    stopwatchMs = 0;
    t = 0;

    stopwatchDisplay.textContent = '00:00.00';
    stopwatchDisplay.classList.remove('activated');
    stopwatchRecord.textContent = '';
    moveRecordToBottom();
};

const addRecord = () => {
    let li = document.createElement('li');
    li.insertAdjacentHTML('beforeend', `<b>${fillDigit(1 + stopwatchRecord.children.length)}
        - </b> ${stopwatchDisplay.textContent}`);
    stopwatchRecord.append(li);
    moveRecordToBottom();
}

buttonStart.onclick = startStopwatch;
buttonStop.onclick = stopStopwatch;
buttonRecord.onclick = addRecord;
buttonReset.onclick = resetStopwatch;

const CONTAINER_HEIGHT = stopwatchRecord.parentElement.clientHeight;
let recordPos = 0;

const moveRecord = (pos = recordPos) => stopwatchRecord.style.top = pos + 'px';

const moveRecordToBottom = () => {
    recordPos = CONTAINER_HEIGHT - stopwatchRecord.clientHeight;
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
            CONTAINER_HEIGHT - stopwatchRecord.clientHeight)
        moveRecord(resultY);
    };

    document.onpointerup = () => {
        stopwatchRecord.classList.remove('no-transition');
        recordPos = resultY;

        document.onpointermove = null;
        document.onpointerup = null;        
    };
};


/* Timer */




// prevent default events
document.ondragstart = () => false;
document.onselectstart = () => false;
document.oncontextmenu = () => false;

updateClock();
startClock();
let alarmSchedule = setInterval(checkAlarm, 5000);
moveRecordToBottom();
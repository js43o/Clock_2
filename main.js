const DAY_MILLISECOND = 1000 * 60 * 60 * 24;
let hands = document.querySelector('.hand').children;

function rotateElem(elem, deg) {
    if (deg % 360 === 0) {
        elem.classList.add('no_transition');
        elem.style.transform = `rotate(0deg)`;
        setTimeout(() => elem.classList.remove('no_transition'), 0);
    } else {
        elem.style.transform = `rotate(${deg}deg)`;
    }
}

function updateHands() {
    let now = new Date();
    rotateElem(hands[0], now.getHours() % 12 * 30 + now.getMinutes() * 0.5);
    rotateElem(hands[1], now.getMinutes() * 6);
    rotateElem(hands[2], now.getSeconds() * 6);
}

function startClock() {
    setInterval(updateHands, 1000);
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

updateHands();
startClock();
const startBtn = document.getElementById('startBtn');
const scanBtn = document.getElementById('scanBtn');
const led = document.getElementById('led');
const log = document.getElementById('log');
const freqDisplay = document.getElementById('freq');
const statusDisplay = document.getElementById('status');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let audioCtx, analyser, dataArray, source, gainNode, ghostFilter;
let threshold = 255;
let isCalibrating = false;

startBtn.onclick = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        initAudio(stream);

        startBtn.disabled = true;
        scanBtn.disabled = false;
        statusDisplay.innerText = "CALIBRATING";

        isCalibrating = true;
        led.style.background = "#ffff00"; // Yellow during cal
        log.innerText = "CALIBRATING TO ROOM NOISE FLOOR... DO NOT MOVE.";

        setTimeout(() => {
            isCalibrating = false;
            led.classList.add('active');
            statusDisplay.innerText = "ACTIVE";
            log.innerText = "CALIBRATION COMPLETE. SCANNER ARMED.";
        }, 5000);

    } catch (err) {
        log.innerText = "ERROR: SENSOR ACCESS DENIED. CHECK MIC PERMISSIONS.";
    }
};

function initAudio(stream) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    ghostFilter = audioCtx.createBiquadFilter();
    gainNode = audioCtx.createGain();

    // The Filter: Focus on High Frequency
    ghostFilter.type = "highpass";
    ghostFilter.frequency.value = 1000;
    gainNode.gain.value = 2.5;

    source.connect(ghostFilter);
    ghostFilter.connect(gainNode);
    gainNode.connect(analyser);
    gainNode.connect(audioCtx.destination); // LIVE AUDIO FEEDBACK

    analyser.fftSize = 128;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    update();
}

function update() {
    requestAnimationFrame(update);
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let currentMax = 0;
    let maxIdx = 0;
    const barWidth = (canvas.width / dataArray.length) * 2;

    for (let i = 0; i < dataArray.length; i++) {
        const barHeight = dataArray[i] / 2;
        ctx.fillStyle = (dataArray[i] > threshold) ? "#ff0000" : "#00ff41";
        ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 2, barHeight);

        if (dataArray[i] > currentMax) {
            currentMax = dataArray[i];
            maxIdx = i;
        }
    }

    if (isCalibrating) {
        if (currentMax > 0) threshold = currentMax + 15;
    } else if (currentMax > threshold && threshold < 255) {
        const nyquist = audioCtx.sampleRate / 2;
        const approxFreq = Math.round(maxIdx * (nyquist / analyser.frequencyBinCount));
        freqDisplay.innerText = approxFreq + "Hz";
        log.innerText = "!! SIGNAL ANOMALY DETECTED !!";
    }
}

// Deep Frequency Scan Logic
scanBtn.onclick = () => {
    log.innerText = "INITIATING DEEP FREQUENCY SCAN...";
    scanBtn.disabled = true;
    scanBtn.style.background = "rgba(0, 255, 65, 0.4)";

    let peakVal = 0;
    let peakIdx = 0;

    // Snapshot the current room audio
    for (let i = 0; i < dataArray.length; i++) {
        if (dataArray[i] > peakVal) {
            peakVal = dataArray[i];
            peakIdx = i;
        }
    }

    setTimeout(() => {
        scanBtn.disabled = false;
        scanBtn.style.background = "transparent";

        if (peakVal < (threshold - 5)) {
            log.innerText = "SCAN RESULT: INCONCLUSIVE. SIGNAL TOO WEAK.";
        } else {
            let entityClass = "";
            if (peakIdx < 10) entityClass = "CLASS I: RESIDUAL ENERGY";
            else if (peakIdx < 35) entityClass = "CLASS III: POLYTERGEIST";
            else entityClass = "CLASS V: INTELLIGENT VAPOR";

            log.innerText = `SUCCESS: ${entityClass}\nENERGY LEVEL: ${peakVal}`;

            // Visual trigger flash
            led.style.background = "#fff";
            setTimeout(() => { led.style.background = ""; led.classList.add('active'); }, 150);
        }
    }, 2500);
};
let video;
let poseNet;
let poses = [];
let scanning = false;

let statusText = document.getElementById("status");
let scanBtn = document.getElementById("scanBtn");
let blip = document.getElementById("blip");

scanBtn.onclick = () => {
    scanning = true;
    statusText.innerText = "Scanning...";
};

function setup() {
    const canvas = createCanvas(window.innerWidth, window.innerHeight);
    canvas.parent("canvas-container");

    video = createCapture({
        video: {
            facingMode: "environment" // BACK CAMERA for phones
        },
        audio: false
    });

    video.size(width, height);
    video.hide();

    poseNet = ml5.poseNet(video, () => {
        statusText.innerText = "Ready - Press Scan";
    });

    poseNet.on("pose", results => {
        poses = results;
    });
}

function draw() {
    image(video, 0, 0, width, height);

    fill(0, 120);
    rect(0, 0, width, height);

    if (scanning) detect();
}

function detect() {
    if (poses.length > 0) {
        let confidence = poses[0].pose.score;

        if (confidence < 0.5) {
            ghostDetected();
        } else {
            statusText.innerText = "Human detected";
            document.body.classList.remove("glitch");
        }
    } else {
        // No detection = suspicious
        if (random(1) > 0.98) {
            ghostDetected();
        }
    }
}

function ghostDetected() {
    statusText.innerText = "⚠ Unknown Entity Detected";

    document.body.classList.add("glitch");

    // Radar blip
    blip.style.top = Math.random() * 100 + "%";
    blip.style.left = Math.random() * 100 + "%";
    blip.style.opacity = 1;

    setTimeout(() => {
        blip.style.opacity = 0;
    }, 500);

    // Flash effect
    if (random(1) > 0.7) {
        background(255);
    }

    // Optional sound
    // playSound();
}

function playSound() {
    let audio = new Audio("sounds/alert.mp3");
    audio.play();
}
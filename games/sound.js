const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const sounds = {};
let soundsLoaded = false;

async function loadSound(name, url) {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        sounds[name] = audioBuffer;
    } catch (e) {
        console.error(`Failed to load sound: ${name}`, e);
    }
}

export async function loadAllSounds() {
    if (soundsLoaded) return;
    await Promise.all([
        loadSound('gunshot', './gunshot.mp3'),
        loadSound('success', './success.mp3'),
        loadSound('fail', './fail.mp3')
    ]);
    soundsLoaded = true;
    console.log('All sounds loaded');
}

export function playSound(name) {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    if (sounds[name]) {
        const source = audioContext.createBufferSource();
        source.buffer = sounds[name];
        source.connect(audioContext.destination);
        source.start(0);
    } else {
        console.warn(`Sound not found: ${name}`);
    }
}


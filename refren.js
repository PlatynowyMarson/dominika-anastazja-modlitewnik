const hero = document.querySelector('.hero');
const motion = hero.querySelector('.hero-motion');
const audio = hero.querySelector('.hero-audio');
const toggle = hero.querySelector('.audio-toggle');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const AudioEngine = window.AudioContext || window.webkitAudioContext;
const clip = fetch(audio.src).then(response => {
  if (!response.ok) throw new Error('Nie udało się pobrać muzyki');
  return response.arrayBuffer();
});
clip.catch(() => {});

let context, gain, source, bufferPromise;
let offset = 0, startedAt = 0, animationFrame = 0;
let muted = false;
let stopping = 0;

function scrollVolume() {
  if (document.hidden || reduced.matches || motion.paused) return 0;
  const box = hero.getBoundingClientRect();
  const visible = Math.max(0, Math.min(box.bottom, innerHeight) - Math.max(box.top, 0));
  const fraction = visible / Math.min(box.height, innerHeight);
  const fade = Math.max(0, Math.min(1, (fraction - 0.16) / 0.67));
  return fade * fade * (3 - 2 * fade);
}

function renderLabel() {
  const playing = Boolean(source && context.state === 'running' && !muted && scrollVolume() > 0);
  toggle.textContent = playing ? 'Wycisz muzykę' : 'Włącz muzykę';
  toggle.setAttribute('aria-pressed', String(playing));
}

function stopAfterFade() {
  if (!source || stopping) return;
  stopping = setTimeout(() => {
    stopping = 0;
    if (!source || (!muted && scrollVolume() > 0)) return;
    offset = (offset + context.currentTime - startedAt) % source.buffer.duration;
    source.stop();
    source.disconnect();
    source = undefined;
    renderLabel();
  }, 140);
}

function sync() {
  const volume = muted ? 0 : scrollVolume();
  if (gain) {
    const now = context.currentTime;
    gain.gain.setTargetAtTime(volume, now, 0.025);
  }
  if (!volume) stopAfterFade();
  else if (stopping) {
    clearTimeout(stopping);
    stopping = 0;
  }
  if (volume && !source) start();
  renderLabel();
}

async function start() {
  if (!AudioEngine || muted || !scrollVolume()) return;
  try {
    if (!context) {
      context = new AudioEngine();
      gain = context.createGain();
      gain.gain.value = 0;
      gain.connect(context.destination);
      bufferPromise = clip.then(bytes => context.decodeAudioData(bytes));
      bufferPromise.catch(() => {});
    }
    if (context.state !== 'running') await context.resume();
    const buffer = await bufferPromise;
    const volume = scrollVolume();
    if (source || muted || !volume || context.state !== 'running') return;
    source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gain);
    startedAt = context.currentTime;
    gain.gain.setTargetAtTime(volume, startedAt, 0.025);
    source.start(0, offset);
    renderLabel();
  } catch {
    // A browser may wait for a user gesture before enabling audio.
  }
}

function schedule() {
  if (animationFrame) return;
  animationFrame = requestAnimationFrame(() => {
    animationFrame = 0;
    sync();
  });
}

toggle.addEventListener('click', () => {
  muted = Boolean(source && !muted);
  sync();
});
hero.addEventListener('pointerdown', (event) => {
  if (!toggle.contains(event.target) && !muted && !source) start();
});
window.addEventListener('scroll', schedule, { passive: true });
window.addEventListener('resize', schedule);
window.addEventListener('pageshow', schedule);
motion.addEventListener('playing', sync);
motion.addEventListener('pause', sync);
document.addEventListener('visibilitychange', sync);
reduced.addEventListener('change', sync);
sync();

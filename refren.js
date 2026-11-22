const hero = document.querySelector('.hero');
const motion = hero.querySelector('.hero-motion');
const audio = hero.querySelector('.hero-audio');
const toggle = hero.querySelector('.audio-toggle');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let visible = false;
let optedOut = false;

function wanted() {
  return visible && !optedOut && !document.hidden && !reduced.matches && !motion.paused;
}

async function sync() {
  if (!wanted()) {
    audio.pause();
    return;
  }
  try {
    await audio.play();
    if (!wanted()) audio.pause();
  } catch {
    // Browsers can require a click for playback with sound.
  }
}

function label() {
  const playing = !audio.paused;
  toggle.textContent = playing ? 'Wycisz muzykę' : 'Włącz muzykę';
  toggle.setAttribute('aria-pressed', String(playing));
}

new IntersectionObserver(([entry]) => {
  visible = entry.intersectionRatio >= 0.45;
  sync();
}, { threshold: [0, 0.45] }).observe(hero);

toggle.addEventListener('click', () => {
  optedOut = !audio.paused;
  sync();
});
audio.addEventListener('play', label);
audio.addEventListener('pause', label);
motion.addEventListener('playing', sync);
motion.addEventListener('pause', sync);
document.addEventListener('visibilitychange', sync);
reduced.addEventListener('change', sync);

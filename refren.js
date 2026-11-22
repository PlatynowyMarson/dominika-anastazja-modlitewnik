const media = document.querySelector('.hero-audio');
const AudioEngine = window.AudioContext || window.webkitAudioContext;
let context, buffer, source;

const data = AudioEngine ? fetch(media.src).then(response => {
  if (!response.ok) throw new Error('Nie udało się wczytać refrenu');
  return response.arrayBuffer();
}) : null;
data?.catch(() => {});

async function playLoop() {
  try {
    if (!AudioEngine) {
      await media.play();
      return;
    }
    context ??= new AudioEngine();
    if (context.state !== 'running') await context.resume();
    buffer ??= context.decodeAudioData(await data);
    const decoded = await buffer;
    if (source || context.state !== 'running') return;

    source = context.createBufferSource();
    source.buffer = decoded;
    source.loop = true;
    source.connect(context.destination);
    source.start();
  } catch {
    // Audio can remain blocked until the browser receives a user gesture.
  }
}

window.addEventListener('pointerdown', playLoop);
window.addEventListener('keydown', playLoop);
window.addEventListener('pageshow', playLoop);
playLoop();

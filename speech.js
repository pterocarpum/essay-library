let isPlaying = false;
let playMode = 'R'; // 'R' = Repeat, 'P' = Paragraph, 'C' = Continuous
let currentLineIndex = 0;

function togglePlayPause(button, leave = false) {
    const essayPage = document.getElementById('essayPage');
    const essayContainer = document.querySelector('.essay-container > div:nth-child(2)');

    if (essayPage.style.display === 'none' || essayContainer.textContent === 'No content avaliable') {
        return;
    }

    if (leave) {
        isPlaying = true;
        currentLineIndex = 0;
    }
    isPlaying = !isPlaying;

    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    playIcon.style.display = isPlaying ? 'none' : 'block';
    pauseIcon.style.display = isPlaying ? 'block' : 'none';
    button.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');

    if (!isPlaying) {
        window.speechSynthesis.cancel();
        essayContainer.innerHTML = essayContainer.textContent; // Remove highlight
        return;
    }

    speakLine(currentLineIndex);
}

function getCurrentLines() {
    const essayContainer = document.querySelector('.essay-container > div:nth-child(2)');
    return essayContainer.textContent
        .split('.')
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => s + '.');
}

/**
 * Given a flat list of sentences and a current index,
 * returns [paraStart, paraEnd] for the paragraph containing that index.
 */
function getParagraphBounds(lines, currentIndex) {
  // First build an array of paragraph lengths
  const text = document.querySelector('.essay-container > div:nth-child(2)').textContent;
  const rawParas = text.split(/\n+/).filter(p => p.trim());
  let cum = 0;

  for (const para of rawParas) {
    const sentences = para
      .split('.')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => s + '.');
    const start = cum;
    const end = cum + sentences.length - 1;
    if (currentIndex >= start && currentIndex <= end) {
      return [start, end];
    }
    cum += sentences.length;
  }
  // fallback to whole document
  return [0, lines.length - 1];
}

function speakLine(index) {
  const essayContainer = document.querySelector('.essay-container > div:nth-child(2)');
  const textContent = essayContainer.textContent;
  const lines = getCurrentLines();

  // figure out paragraph start/end
  const [paraStart, paraEnd] = getParagraphBounds(lines, index);

  // highlight only the one sentence
  const target = lines[index];
  essayContainer.innerHTML = textContent.replace(
    target,
    `<span class="highlight-sentence">${target}</span>`
  );

  const utterance = new SpeechSynthesisUtterance(target);
  utterance.voice = speechSynthesis.getVoices().find(v => v.name === localStorage.getItem('voiceName'));
  utterance.rate = parseFloat(localStorage.getItem('voiceSpeed'));

  utterance.onend = () => {
    if (!isPlaying) return;

    if (playMode === 'R') {
      setTimeout(() => speakLine(index), 0);
    } else if (playMode === 'P') {
      const next = index < paraEnd ? index + 1 : paraStart;
      currentLineIndex = next;
      setTimeout(() => speakLine(next), 0);
    } else { // Continuous
      const next = (index + 1) % lines.length;
      currentLineIndex = next;
      setTimeout(() => speakLine(next), 0);
    }
  };

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);

  // scroll highlight into view
  const span = essayContainer.querySelector('.highlight-sentence');
  if (span) span.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function skipBackward() {
    const lines = getCurrentLines();
    if (lines.length === 0) return;

    if (isPlaying) {
        currentLineIndex = (currentLineIndex - 1 + lines.length) % lines.length;
        window.speechSynthesis.cancel();
        speakLine(currentLineIndex);
    }
}

function skipForward() {
    const lines = getCurrentLines();
    if (lines.length === 0) return;

    if (isPlaying) {
        currentLineIndex = (currentLineIndex + 1) % lines.length;
        window.speechSynthesis.cancel();
        speakLine(currentLineIndex);
    }
}

function toggleMode() {
    const modes = ['R', 'P', 'C'];
    const currentIndex = modes.indexOf(playMode);
    playMode = modes[(currentIndex + 1) % modes.length];
    document.getElementById('mode-label').textContent = playMode;
}

function updateHighlight() {
    const essayContainer = document.querySelector('.essay-container > div:nth-child(2)');
    const lines = getCurrentLines();
    if (currentLineIndex >= lines.length) return;

    const targetLine = lines[currentLineIndex];
    const highlightedHTML = essayContainer.textContent.replace(
        targetLine,
        `<span class="highlight-sentence">${targetLine}</span>`
    );
    essayContainer.innerHTML = highlightedHTML;

    const highlightSpan = essayContainer.querySelector('.highlight-sentence');
    if (highlightSpan) {
        highlightSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

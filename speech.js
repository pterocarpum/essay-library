let isPlaying = false;
let repeatMode = true; // true = Repeat (R), false = Continue (C)
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

function speakLine(index) {
    const essayContainer = document.querySelector('.essay-container > div:nth-child(2)');
    const lines = getCurrentLines();
    const targetLine = lines[index];
    const textContent = essayContainer.textContent;

    // Highlight current line using dynamic content
    const highlightedHTML = textContent.replace(
        targetLine,
        `<span class="highlight-sentence">${targetLine}</span>`
    );
    essayContainer.innerHTML = highlightedHTML;

    const utterance = new SpeechSynthesisUtterance(targetLine);
    utterance.voice = window.speechSynthesis.getVoices().find(v => v.name === 'Google UK English Male');
    utterance.rate = 1.2;

    utterance.onend = () => {
        if (isPlaying) {
            if (repeatMode) {
                speakLine(currentLineIndex);
            } else {
                currentLineIndex = (currentLineIndex + 1) % lines.length
                speakLine(currentLineIndex);
            }
        }
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);

    const highlightSpan = essayContainer.querySelector('.highlight-sentence');
    if (highlightSpan) {
        highlightSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
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
    repeatMode = !repeatMode;
    document.getElementById('mode-label').textContent = repeatMode ? 'R' : 'C';
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

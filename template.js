// script.js
// Load metadata and initialize UI
let metadataMap = {};
let metadataList = [];
let savedTheme = '';

async function main() {
  metadataMap = loadEssayMetadata();
  metadataList = Object.entries(metadataMap).map(([path, data]) => ({ path, ...data }));
  const [topics, count] = loadAllTopics(metadataMap);
  populateTopicSelect(topics, count);
  buildHomePage(metadataList);
  // Bind search and filter
  document.querySelector('.search-bar input[type="text"]').addEventListener('input', performSearch);
  document.querySelector('.search-bar select').addEventListener('change', performSearch);
};

function populateTopicSelect(topics, count) {
  const select = document.querySelector('.search-bar select');
  select.querySelectorAll('option:not([value=""])').forEach(opt => opt.remove());
  topics.forEach(folder => {
    const opt = document.createElement('option');
    opt.value = folder;
    opt.textContent = `${formatTopic(folder)} (${count[folder] || 0})`;
    select.appendChild(opt);
  });
}

function buildHomePage(list, query = '') {
  const container = document.getElementById('cardsContainer') || document.getElementById('homePage');
  container.querySelectorAll('.essay-card').forEach(card => card.remove());

  // Split query into lower-case words, filter out empty strings
  const queryWords = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  list.forEach(item => {
    const card = document.createElement('div');
    card.className = 'essay-card';
    card.dataset.path = item.path;

    // Format and highlight title
    const title = document.createElement('h2');
    title.innerHTML = highlightMatches(item.question, queryWords);
    card.appendChild(title);

    // Format topic
    const topicDiv = document.createElement('div');
    topicDiv.className = 'tags';
    topicDiv.textContent = 'Topic: ' + formatTopic(item.folder);
    card.appendChild(topicDiv);

    // Format and highlight tags
    const tags = document.createElement('div');
    tags.className = 'tags';
    const allTags = [...(item.main_tags || []), ...(item.other_tags || [])];
    let matchedTags = new Set();
    let unmatchedTags = new Set();
    allTags.forEach(tag => {
      if (queryWords.some(q => tag.startsWith(q))) {
        matchedTags.add(tag);
      } else {
        unmatchedTags.add(tag);
      }
    });
    matchedTags = Array.from(matchedTags);
    unmatchedTags = Array.from(unmatchedTags);
    // Ensure matched tags are in the first 12
    const topTags = matchedTags.concat(unmatchedTags).slice(0, 12);
    tags.innerHTML = 'Tags: ' + topTags.join(', ') + (allTags.length > 12 ? '...' : '');
    tags.innerHTML = highlightMatches(tags.innerHTML, queryWords);
    card.appendChild(tags);

    card.addEventListener('click', () => showEssay(item));
    container.appendChild(card);
  });

  function highlightMatches(text, queries) {
    if (queries.length === 0) return escapeHTML(text);

    return text
      .split(/\b/)
      .map(word => {
      let lowerWord = cleanWord(word);
      // Only highlight if the word contains at least one alphanumeric character
      if (!/[a-z0-9]/i.test(word)) return escapeHTML(word);
      const match = queries.some(q => lowerWord.startsWith(q) || q.startsWith(lowerWord));
      return match ? `<span style="color:rgb(211, 109, 86);">${escapeHTML(word)}</span>` : escapeHTML(word);
      }).join('');
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

function performSearch() {
  let query = document.querySelector('.search-bar input[type="text"]').value;
  const topic = document.querySelector('.search-bar select').value;
  let results;

  if (query.trim()) {
    // Score and sort by match relevance
    const scored = scoreEssaysByTagMap(metadataMap, query);
    // Map scored paths to metadata items
    results = scored.map(r => {
      return metadataList.find(item => item.path === r.path);
    }).filter(Boolean);
    // Optionally filter by topic after scoring
    if (topic) {
      results = results.filter(item => item.folder === topic);
    }
  } else {
    // No query: full list, optionally filtered by topic
    results = metadataList.slice();
    if (topic) {
      results = results.filter(item => item.folder === topic);
    }
  }
  query = query.trim();
  query = query.replace(/[^a-z0-9\s]/gi, ''); // Remove special characters
  buildHomePage(results, query);
}

function showEssay(item) {
  // Save current scroll position
  sessionStorage.setItem('homeScroll', window.scrollY);
  
  document.getElementById('homePage').style.display = 'none';
  document.getElementById('essayPage').style.display = 'inline';
  
  // Scroll to top of essay
  window.scrollTo(0, 0);
  
  document.querySelector('.essay-title').textContent = item.question || 'No title available';
  document.querySelector('.essay-container > div:nth-child(2)').textContent = dtc(item.content, localStorage.getItem('key')+item.path) || 'No content available.';
  document.querySelector('#summaryPopup p').textContent = dtc(item.summary, localStorage.getItem('key')+item.filename) || 'No summary available.';
  console.log(`Tags: ${item.main_tags.join(', ')}\n\nOther tags: ${item.other_tags.join(', ')}`);
}

function goToHome() {
  document.getElementById('essayPage').style.display = 'none';
  document.getElementById('homePage').style.display = 'block';
  
  // Restore previous scroll position
  const saved = sessionStorage.getItem('homeScroll');
  if (saved !== null) {
    window.scrollTo(0, parseInt(saved, 10));
  }
}

// Show the summary popup + overlay
function showSummary() {
  document.body.style.overflow = 'hidden';
  document.querySelector('.back-button').disabled = true;
  document.querySelector('.floating-button').style.display = 'none';
  document.getElementById('overlay').style.display = 'block';
  document.getElementById('summaryPopup').style.display = 'block';
}

// Hide/close summary popup + overlay
function hideSummary() {
  document.body.style.overflow = '';
  document.querySelector('.back-button').disabled = false;
  document.querySelector('.floating-button').style.display = 'block';
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('summaryPopup').style.display = 'none';
  
}

function loadEssayMetadata() {
  const result = {};
  key = localStorage.getItem('key');
  essayMetadataRaw.forEach(item => {
    let a = {
      filename: item.filename,
      folder: dtc(item.folder, key+item.filename),
      summary: item.summary,
      question: dtc(item.question, key+item.filename),
      main_tags: item.main_tags,
      other_tags: item.other_tags,
    };
    const path = `essay_library\\${a.folder}\\${item.filename}`;
    const content = essayContentsRaw[path] || '';
    result[path] = a
    result[path].content = content;
  });
  return result;
}

function cleanWord(word) {
  return word.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function scoreEssaysByTagMap(metadataMap, query) {
  const queryWords = query.split(/\s+/).map(cleanWord).filter(Boolean);
  const results = [];
  Object.entries(metadataMap).forEach(([path, { question = '', main_tags = [], other_tags = [] }]) => {
    let score = 0;
    // Search within question text (weight 10), match from start
    const questionWords = question.split(/\s+/).map(cleanWord).filter(Boolean);
    questionWords.forEach(word => {
      queryWords.forEach(q => {
        if (word.startsWith(q)) score += 10;
      });
    });
    // Search main tags (weight 5), match from start
    main_tags.forEach(tag => {
      const tagLower = tag.toLowerCase();
      queryWords.forEach(q => { if (tagLower.startsWith(q)) score += 5; });
    });
    // Search other tags (weight 1), match from start
    other_tags.forEach(tag => {
      const tagLower = tag.toLowerCase();
      queryWords.forEach(q => { if (tagLower.startsWith(q)) score += 1; });
    });
    if (score > 0) results.push({ path, score });
  });
  return results.sort((a, b) => b.score - a.score).slice(0, 100);
}

function formatTopic(inputString) {
  if (typeof inputString !== 'string') return '';
  inputString = inputString.replace(/_/g, ' ').split(' ').map((w, i) => {
    const lw = w.toLowerCase();
    if ((lw === 'and' || lw === 'in') && i !== 0) return lw;
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(' ');
  return inputString.split('(')[0].trim();
}

function loadAllTopics(metadataMap) {
  // Collect topics and count how many articles have each topic
  const topicCounts = {};
  Object.values(metadataMap).forEach(item => {
    if (item.folder) {
      topicCounts[item.folder] = (topicCounts[item.folder] || 0) + 1;
    }
  });
  // Return sorted array of topics and the count object
  const sortedTopics = Object.keys(topicCounts).sort();
  return [sortedTopics, topicCounts];
}

// Cache helper function
function getReconstructedData(prefix) {
    let i = 0;
    let combined = '';
    while (sessionStorage.getItem(`${prefix}${i}`)) {
        combined += sessionStorage.getItem(`${prefix}${i}`);
        i++;
    }
    if (!combined) return null;
    // Decompress the combined string
    combined = LZString.decompressFromUTF16(combined);
    try {
        combined = JSON.parse(combined);
        return combined; // Return the parsed object
    } catch (e) {
        console.error("Error parsing cached data:", e);
        return null; // If parsing fails, return null
    }
}

// --- Light/Dark mode toggle ---
document.addEventListener('DOMContentLoaded', () => {
  // Theme toggle logic
  const toggleBtn = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  // Add moon icon SVG (hidden by default)
  themeIcon.insertAdjacentHTML('beforeend', `
    <svg class="icon-moon" width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>
    </svg>
  `);

  function setTheme(dark) {
    if (dark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
  // Initial theme
  savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(savedTheme === 'dark' || (!savedTheme && prefersDark));

  toggleBtn.addEventListener('click', () => {
    const isDark = !document.body.classList.contains('dark-mode');
    setTheme(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });

  // Load cached data from sessionStorage
  let cachedContents = getReconstructedData('essayContentsRaw');
  let cachedMetadata = getReconstructedData('essayMetadataRaw');
  essayContentsRaw = cachedContents || {};
  essayMetadataRaw = cachedMetadata || [];
  if (essayContentsRaw && essayMetadataRaw.length > 0) {
      main();
      return;
  }

  // Check if secrets are already stored in localStorage
  const secret = localStorage.getItem('secret');
  const key = localStorage.getItem('key');
  if (secret && key) {
      submitSecretKey();
  }
});

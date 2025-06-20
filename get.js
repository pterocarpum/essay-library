let essayContentsRaw;
let essayMetadataRaw;

// Show popup when title is clicked
document.querySelector('span#titleClick').addEventListener('click', () => {
  localStorage.removeItem('secret');
  localStorage.removeItem('key');
  document.getElementById('secretKeyOverlay').style.display = 'block';
  document.getElementById('secretKeyPopup').style.display = 'block';
});

// Hide popup
function hideSecretKeyPopup() {
  document.getElementById('secretKeyOverlay').style.display = 'none';
  document.getElementById('secretKeyPopup').style.display = 'none';
}

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function isValidLZStringBase64(str) {
  try {
    const result = LZString.decompressFromBase64(str);
    return result !== '';
  } catch (e) {
    return false;
  }
}

async function submitSecretKey() {
    let secret = document.getElementById("secretInput").value.trim();
    if (!secret) {
        secret = localStorage.getItem('secret')
        if (isValidLZStringBase64(secret)) secret = LZString.decompressFromBase64(secret);
    }
    const key = document.getElementById("keyInput").value.trim() || localStorage.getItem('key');
    const btn = document.getElementById('submitSecretKeyButton');
    const loadingWords = document.querySelector('#loadingScreen p');

    if (!secret || !key) {
        return;
    }
    btn.disabled = true;
    let error = false;
    showLoading();
    loadingWords.textContent = 'Loading Contents';
    await fetchData(secret, 'essay_content')
        .then(data => {
            if (data.includes('error')) {
                error = true;
                return;
            }
            essayContentsRaw = data; // Compressed contents
        })
        .catch(error => {
            console.error("Error fetching data:", error);
            error = true;
        });
    loadingWords.textContent = 'Loading Metadata';
    await fetchData(secret, 'essay_metadata')
        .then(data => {
            if (data.includes('error')) {
                error = true;
                return;
            }
            essayMetadataRaw = data; // Compressed contents
        })
        .catch(error => {
            console.error("Error fetching data:", error);
            error = true;
        });
    if (error) {
        loadingWords.textContent = 'Error with downloading data';
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for 3 seconds
        hideLoading();
        btn.disabled = false;
        return;
    }
    // Store secrets in localStorage
    loadingWords.textContent = 'Caching';
    if (!isValidLZStringBase64(localStorage.getItem('secret'))) localStorage.setItem('secret', LZString.compressToBase64(secret));
    if (localStorage.getItem('key') !== key) localStorage.setItem('key', predeterminedScramble(key));
    // cache data in sessionStorage
    sessionStorage.clear(); // Clear previous sessionStorage data

    let compressedContents = LZString.compressToUTF16(essayContentsRaw);
    let compressedMetadata = LZString.compressToUTF16(essayMetadataRaw);
    try {
        // Split and store essayContentsRaw
        let i = 0;
        while (compressedContents.length > 0) {
            sessionStorage.setItem(`essayContentsRaw${i}`, compressedContents.slice(0, 100000));
            compressedContents = compressedContents.slice(100000);
            i++;
        }

        // Split and store essayMetadataRaw
        let j = 0;
        while (compressedMetadata.length > 0) {
            sessionStorage.setItem(`essayMetadataRaw${j}`, compressedMetadata.slice(0, 100000));
            compressedMetadata = compressedMetadata.slice(100000);
            j++;
        }
    } catch {
        loadingWords.textContent = 'Caching failed';
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 seconds
    loadingWords.textContent = 'Formatting'
    // Decompress and parse the data
    essayContentsRaw = LZString.decompressFromEncodedURIComponent(essayContentsRaw);
    essayContentsRaw = JSON.parse(essayContentsRaw); // Parse the decompressed string to JSON
    essayMetadataRaw = LZString.decompressFromEncodedURIComponent(essayMetadataRaw);
    essayMetadataRaw = JSON.parse(essayMetadataRaw); // Parse the decompressed string to JSON
    await main();
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for 0.5 seconds
    // Reset inputs and hide popup
    btn.disabled = false;
    document.getElementById('secretInput').value = '';
    document.getElementById('keyInput').value = '';
    hideSecretKeyPopup();
    hideLoading();
}

// Replace direct usage with debounced version
const debouncedSubmitSecretKey = debounce(submitSecretKey, 400);

async function fetchData(secretKey, endpoint) {
    const baseUrl = "https://script.google.com/macros/s/AKfycbzgyrPXWsspNNfuKsQBf8er92JjudaeqkWHsqbYWkVn-nBdqEXsV9mDlAWl46FRuPIi/exec";
    const url = `${baseUrl}?secretKey=${encodeURIComponent(secretKey)}&endpoint=${encodeURIComponent(endpoint)}&userAgent=${encodeURIComponent(navigator.userAgent)}`;

    try {
        const response = await fetch(url, {
            method: 'GET'
        });

        if (!response.ok) {
            // Attempt to read error message from response body if available
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}. Details: ${errorText}`);
        }
        const data = await response.text();
        return data;
    } catch (error) {
        console.error("Error fetching data:", error);
        throw error; // Re-throw to be caught by the submitSecretKey's try-catch
    }
}

function showLoading() {
  document.getElementById('loadingScreen').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loadingScreen').style.display = 'none';
}
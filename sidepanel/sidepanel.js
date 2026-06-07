const btn = document.getElementById('summarize-btn');
const btnText = document.querySelector('.btn-text');
const btnLoader = document.getElementById('btn-loader');
const statusContainer = document.getElementById('status-container');
const statusText = document.getElementById('status-text');
const summaryContainer = document.getElementById('summary-container');
const summaryContent = document.getElementById('summary-content');
const setupInstructions = document.getElementById('setup-instructions');

function showStatus(text) {
  statusContainer.classList.remove('hidden');
  statusText.textContent = text;
}

function hideStatus() {
  statusContainer.classList.add('hidden');
}

function setBtnLoading(isLoading) {
  if (isLoading) {
    btn.disabled = true;
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');
  } else {
    btn.disabled = false;
    btnText.classList.remove('hidden');
    btnLoader.classList.add('hidden');
  }
}

btn.addEventListener('click', async () => {
  setBtnLoading(true);
  hideStatus();
  summaryContainer.classList.add('hidden');
  setupInstructions.classList.add('hidden');
  summaryContent.textContent = '';

  try {
    // 1. Check Prompt API availability
    if (!globalThis.LanguageModel) {
      // The API is completely missing from this browser version
      setupInstructions.classList.remove('hidden');
      setBtnLoading(false);
      return;
    }

    const availability = await LanguageModel.availability({
      expectedInputs: [{ type: "text", languages: ["en"] }],
      expectedOutputs: [{ type: "text", languages: ["en"] }]
    });

    if (availability === 'unavailable') {
      // The API exists but the model is unavailable (flags not set correctly)
      setupInstructions.classList.remove('hidden');
      setBtnLoading(false);
      return;
    }

    // 2. Extract page text from active tab
    showStatus('Extracting page text...');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url || tab.url.startsWith('chrome://')) {
      showStatus('Cannot summarize internal Chrome pages.');
      setBtnLoading(false);
      return;
    }

    const [{ result: pageText }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Clone body to avoid messing with live DOM
        const body = document.body.cloneNode(true);
        // Remove noise
        body.querySelectorAll('script, style, nav, footer, header, noscript, iframe').forEach(el => el.remove());
        // Return text, limited to 5000 chars to avoid overwhelming the prompt
        return body.innerText.substring(0, 5000);
      }
    });

    if (!pageText || pageText.trim().length === 0) {
      showStatus('No readable text found on this page.');
      setBtnLoading(false);
      return;
    }

    // 3. Create Session and Stream Summary
    showStatus('Initializing AI model...');
    
    const session = await LanguageModel.create({
      expectedInputs: [{ type: "text", languages: ["en"] }],
      expectedOutputs: [{ type: "text", languages: ["en"] }],
      initialPrompts: [{ role: 'system', content: 'You are a helpful assistant. Summarize the provided web page content clearly and concisely using markdown bullet points.' }],
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          const pct = e.total ? Math.floor((e.loaded / e.total) * 100) : 0;
          showStatus(`Downloading AI model: ${pct}%...`);
        });
      }
    });

    hideStatus();
    summaryContainer.classList.remove('hidden');

    for await (const chunk of session.promptStreaming(`Summarize the following text:\n\n${pageText}`)) {
      summaryContent.textContent += chunk; // Append as the stream arrives
    }

    session.destroy();

  } catch (err) {
    console.error('Summarization Error:', err);
    showStatus(`Error: ${err.message || 'Something went wrong.'}`);
  } finally {
    setBtnLoading(false);
  }
});

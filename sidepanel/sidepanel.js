const btn = document.getElementById('summarize-btn');
const btnText = document.querySelector('.btn-text');
const btnLoader = document.getElementById('btn-loader');
const statusContainer = document.getElementById('status-container');
const statusText = document.getElementById('status-text');
const summaryContainer = document.getElementById('summary-container');
const summaryContent = document.getElementById('summary-content');
const setupInstructions = document.getElementById('setup-instructions');
const copyBtn = document.getElementById('copy-btn');
const formatSelect = document.getElementById('format-select');
const customQueryInput = document.getElementById('custom-query');

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

copyBtn.addEventListener('click', async () => {
  const textToCopy = summaryContent.innerText;
  if (!textToCopy) return;
  
  try {
    await navigator.clipboard.writeText(textToCopy);
    copyBtn.classList.add('copied');
    copyBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6L9 17l-5-5"></path>
      </svg>
    `;
    
    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      `;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
});

btn.addEventListener('click', async () => {
  setBtnLoading(true);
  hideStatus();
  summaryContainer.classList.add('hidden');
  setupInstructions.classList.add('hidden');
  summaryContent.textContent = '';

  try {
    // 1. Check Prompt API availability
    if (!globalThis.LanguageModel) {
      setupInstructions.classList.remove('hidden');
      setBtnLoading(false);
      return;
    }

    const availability = await LanguageModel.availability({
      expectedInputs: [{ type: "text", languages: ["en"] }],
      expectedOutputs: [{ type: "text", languages: ["en"] }]
    });

    if (availability === 'unavailable') {
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
        const body = document.body.cloneNode(true);
        body.querySelectorAll('script, style, nav, footer, header, noscript, iframe').forEach(el => el.remove());
        return body.innerText.substring(0, 5000);
      }
    });

    if (!pageText || pageText.trim().length === 0) {
      showStatus('No readable text found on this page.');
      setBtnLoading(false);
      return;
    }

    // 3. Build Prompt Strategy
    const format = formatSelect.value;
    const customQuery = customQueryInput.value.trim();
    
    let systemInstruction = 'You are a helpful reading assistant.';
    if (format === 'bullet') systemInstruction += ' Output your response in clear markdown bullet points.';
    if (format === 'paragraph') systemInstruction += ' Output your response as a single, concise paragraph.';
    if (format === 'detailed') systemInstruction += ' Output your response as a detailed, multi-paragraph explanation with headers if necessary.';

    let userPrompt = '';
    if (customQuery) {
      userPrompt = `Please answer this question based on the text below:\n\nQuestion: ${customQuery}\n\nText:\n${pageText}`;
    } else {
      userPrompt = `Please summarize the following text according to your instructions:\n\n${pageText}`;
    }

    // 4. Create Session and Stream Summary
    showStatus('Initializing AI model...');
    
    const session = await LanguageModel.create({
      expectedInputs: [{ type: "text", languages: ["en"] }],
      expectedOutputs: [{ type: "text", languages: ["en"] }],
      initialPrompts: [{ role: 'system', content: systemInstruction }],
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          const pct = e.total ? Math.floor((e.loaded / e.total) * 100) : 0;
          showStatus(`Downloading AI model: ${pct}%...`);
        });
      }
    });

    hideStatus();
    summaryContainer.classList.remove('hidden');

    for await (const chunk of session.promptStreaming(userPrompt)) {
      summaryContent.textContent += chunk; 
    }

    session.destroy();

  } catch (err) {
    console.error('Summarization Error:', err);
    showStatus(`Error: ${err.message || 'Something went wrong.'}`);
  } finally {
    setBtnLoading(false);
  }
});

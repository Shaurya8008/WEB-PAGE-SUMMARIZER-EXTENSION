# Web Page Summarizer Extension

A modern, fast, and 100% free Chrome Extension that summarizes any web page instantly using Chrome's built-in on-device AI (`LanguageModel` Prompt API).

## ✨ Features
- **On-Device AI:** Runs locally using Gemini Nano directly in your browser. No API keys needed!
- **Privacy First:** Your data never leaves your machine.
- **Custom Prompts:** Ask specific questions about the page content or get a general summary.
- **Format Options:** Choose between Bullet Points, a Short Paragraph, or a Detailed Explanation.
- **Copy to Clipboard:** Instantly copy the AI's response with a single click.
- **Sleek Side Panel:** A beautiful glassmorphic UI with dark mode support.
- **Smart Extraction:** Automatically strips away navigation bars, footers, and ads to only summarize the core content.

## 🚀 Installation & Setup

Because this extension uses Chrome's experimental built-in AI, you need to enable it first.

### 1. Enable Chrome's Built-in AI
1. Go to `chrome://flags/#prompt-api-for-gemini-nano` and set it to **Enabled**.
2. Go to `chrome://flags/#optimization-guide-on-device-model` and set it to **Enabled BypassPrefRequirement**.
3. **Relaunch** Chrome.
4. Go to `chrome://components`, locate the **Optimization Guide On Device Model**, and click **Check for update** to download the model (it's about 1.5GB).
   - *(If you don't see it, open a website, press `Cmd+Option+J` (or `Ctrl+Shift+J`) to open the console, type `await LanguageModel.create();` and hit enter. Then refresh the components page).*

### 2. Install the Extension
1. Go to `chrome://extensions/` in your Chrome browser.
2. Turn on **Developer mode** in the top right.
3. Click **Load unpacked** and select the folder containing this extension.
4. Pin the extension to your toolbar for easy access!

## 💡 Usage
1. Navigate to any article, blog post, or documentation page.
2. Click the extension icon to open the Side Panel.
3. Click **Summarize Page** and watch the AI stream a concise summary in real-time.

## 🛠️ Built With
- **HTML/CSS/JS:** Vanilla web technologies for max performance.
- **Chrome Extensions API:** Manifest V3, Side Panel API, Scripting API.
- **Prompt API:** Chrome's native `LanguageModel` API for on-device AI.

---
*Created for the 100 Days of Code / Daily Projects Challenge - Day 2.*

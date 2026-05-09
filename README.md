# Text Enhancer Chrome Extension

A powerful Chrome extension that enhances text readability with font customization, translation, and summarization features.

## Features

- **Font Control**: Adjust font size, family, letter spacing, and line height
- **Text Translation**: Translate selected text using LibreTranslate API
- **Text Summarization**: Get concise summaries using Hugging Face API
- **Context Menu**: Right-click options for quick translation and summarization
- **Persistent Settings**: Your preferences are saved across sessions

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the extension folder
4. The extension icon will appear in your toolbar

## Usage

### Font Controls
- Click the extension icon to open the popup
- Use the sliders to adjust font settings
- Click "Apply" to apply changes to the current page
- Click "Reset" to revert to default settings

### Translation
- Select text on any webpage
- Click the extension icon and go to the "Translate" tab
- Select target language and click "Translate"
- Or right-click selected text and choose "Translate"

### Summarization
- Select text on any webpage
- Click the extension icon and go to the "Summarize" tab
- Choose summary length and click "Summarize"
- Or right-click selected text and choose "Summarize"

## API Configuration

### Translation API
Uses LibreTranslate (free open-source translation API). No API key required.

### Summarization API
Uses Hugging Face inference API by default, with Gemini API as an alternative option:

#### Hugging Face API:
1. Create a free account at [Hugging Face](https://huggingface.co)
2. Get an API token from your account settings
3. Update the API token in `background.js` and `popup.js`

#### Gemini API:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Replace `your_gemini_api_key_here` in `background.js` only
4. Select "Gemini API" from the API preference dropdown in the Summarization tab

Note: All API calls are now handled centrally through the background script. You can switch between APIs using the dropdown in the Summarization tab.

## File Structure

```
├── manifest.json      # Extension configuration
├── popup.html         # Popup UI
├── popup.css          # Popup styles
├── popup.js           # Popup functionality
├── content.js         # Content script for page manipulation
├── background.js      # Background service worker
└── icons/             # Extension icons
    ├── icon16.svg
    ├── icon48.svg
    └── icon128.svg
```

## Development

To modify the extension:
1. Make changes to the relevant files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## License

MIT License - Feel free to modify and distribute.
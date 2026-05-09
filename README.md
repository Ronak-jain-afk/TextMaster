# Text Enhancer

A sophisticated Chrome extension designed for elite reading experiences and accessibility. Built with a modern, minimalist dark aesthetic.

## 🌑 Overview

Text Enhancer transforms the way you consume content online. Whether you need better accessibility through specialized fonts, a cleaner reading environment with global Dark Mode, or instant translations with Text-to-Speech support, Text Enhancer provides a sleek, distraction-free utility.

## ✨ Features

### 🎨 Appearance & Typography
- **Advanced Font Control**: Precisely adjust font size, family, letter spacing, and line height.
- **Accessibility First**: Includes **OpenDyslexic**, a font designed specifically to mitigate common reading errors caused by dyslexia.
- **Modern Aesthetic**: Features the **Inter** typeface and a high-performance minimalist dark UI.
- **Global Dark Mode**: A powerful filter-based engine that intelligently inverts website colors while preserving the natural look of images and videos.

### 🌐 Intelligence & Accessibility
- **Instant Translation**: Translate selected text into dozens of languages via the popup or right-click context menu.
- **Smart Overlay**: Translations appear in a sleek on-page overlay, allowing you to read without losing your place.
- **Read Aloud (TTS)**: High-quality Text-to-Speech support. Listen to any selected text or translated results directly from the page or popup.
- **Context Menu Integration**: Quick-action "Translate" and "Read Aloud" options available on right-click.

## 🚀 Installation

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **"Developer mode"** in the top right corner.
4. Click **"Load unpacked"** and select the project folder.
5. Pin the extension for the best experience.

## 🛠 Usage

### Appearance Tab
- Select your preferred **Font Family** (Default, Inter, Georgia, OpenDyslexic, etc.).
- Use the **Sliders** to fine-tune your reading experience.
- Toggle **Dark Mode** to instantly darken any webpage.
- Click **Apply** to save changes to the current tab.

### Translate Tab
- **Select text** on any page; it will automatically populate the translation input.
- Choose your **Target Language** and click **Translate**.
- Use **Speak** to hear the translation or **Copy** to save it.
- **Context Menu**: Right-click any text on a page to translate it instantly—the result will appear in a sleek overlay in the top-right corner.

## 📁 Project Structure

```
├── manifest.json      # Extension configuration & permissions
├── background.js      # Service worker for translation APIs & context menus
├── content.js         # Core engine for CSS injection, Dark Mode & TTS
├── popup.html         # Modern minimalist UI layout
├── popup.css          # Dark theme styles & animations
├── popup.js           # UI logic & messaging
└── icons/             # Brand assets (16, 48, 128px)
```

## 🛠 Technical Details

- **Design**: Minimalist Dark Theme (320px width) using CSS Variables and Inter font.
- **Engine**: Filter-based Dark Mode inversion with media preservation.
- **API**: Powered by the LibreTranslate API (HTTPS).
- **Persistence**: Uses `chrome.storage.sync` to remember your settings across all your devices.

## ⚖ License

MIT License - Designed for the open web. Feel free to fork and enhance.
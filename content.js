// Content script for font manipulation
class TextEnhancerContent {
    constructor() {
        this.init();
        this.loadSettings();
    }

    init() {
        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case 'applyFontSettings':
                    this.applyFontSettings(request.settings);
                    sendResponse({ success: true });
                    break;
                
                case 'getSelectedText':
                    const selectedText = this.getSelectedText();
                    sendResponse({ text: selectedText });
                    break;

                case 'showTranslation':
                    this.showTranslationOverlay(request.translation, request.originalText);
                    sendResponse({ success: true });
                    break;
                
                case 'readAloud':
                    this.readAloud(request.text);
                    sendResponse({ success: true });
                    break;
                
                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
            return true; // Keep message channel open for async response
        });

        // Apply saved settings on page load
        this.applySavedSettings();
    }

    async loadSettings() {
        this.settings = await chrome.storage.sync.get('fontSettings');
    }

    applySavedSettings() {
        chrome.storage.sync.get('fontSettings', (result) => {
            if (result.fontSettings) {
                this.applyFontSettings(result.fontSettings);
            }
        });
    }

    applyFontSettings(settings) {
        const styleId = 'text-enhancer-styles';
        const fontFaceId = 'text-enhancer-font-face';
        const darkModeId = 'text-enhancer-dark-mode';
        
        // Ensure OpenDyslexic is available
        if (!document.getElementById(fontFaceId)) {
            const fontFace = document.createElement('style');
            fontFace.id = fontFaceId;
            fontFace.textContent = `
                @font-face {
                    font-family: 'OpenDyslexic';
                    src: url('https://cdn.jsdelivr.net/npm/opendyslexic@1.0.3/font/OpenDyslexic-Regular.otf');
                }
            `;
            document.head.appendChild(fontFace);
        }

        // Handle Dark Mode
        let existingDarkMode = document.getElementById(darkModeId);
        if (existingDarkMode) {
            existingDarkMode.remove();
        }

        if (settings.darkMode) {
            const darkModeStyle = document.createElement('style');
            darkModeStyle.id = darkModeId;
            darkModeStyle.textContent = `
                html {
                    filter: invert(1) hue-rotate(180deg) !important;
                    background-color: #000 !important;
                }
                
                /* Re-invert media elements so they look normal */
                img, video, iframe, canvas, picture, [style*="background-image"] {
                    filter: invert(1) hue-rotate(180deg) !important;
                }

                /* Fix for websites that already have a dark theme to avoid double inversion if possible */
                /* This is a simple heuristic, many extensions use more complex logic */
                
                body {
                    background-color: #000 !important;
                }
            `;
            document.head.appendChild(darkModeStyle);
        }

        // Remove existing font style if any
        let existingStyle = document.getElementById(styleId);
        if (existingStyle) {
            existingStyle.remove();
        }

        // Create new font style element
        const style = document.createElement('style');
        style.id = styleId;
        
        const css = `
            * {
                font-size: ${settings.fontSize} !important;
                font-family: ${settings.fontFamily} !important;
                letter-spacing: ${settings.letterSpacing} !important;
                line-height: ${settings.lineHeight} !important;
            }
            
            /* Preserve some elements that shouldn't be modified excessively */
            input, textarea, select, button, code, pre, [class*="icon"], [class*="fa-"], .material-icons, .fa, .fas, .far, .fab {
                font-size: initial !important;
                font-family: initial !important;
                letter-spacing: initial !important;
                line-height: initial !important;
            }
            
            /* Preserve form elements with a bit more style */
            input[type="text"],
            input[type="password"],
            input[type="email"],
            input[type="number"],
            input[type="search"],
            input[type="tel"],
            input[type="url"],
            textarea,
            select {
                font-size: 14px !important;
                font-family: system-ui, -apple-system, sans-serif !important;
                letter-spacing: normal !important;
                line-height: 1.4 !important;
            }
            
            /* Preserve code blocks */
            code, pre {
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
                font-size: 12px !important;
                line-height: 1.4 !important;
                letter-spacing: normal !important;
            }
            
            /* Preserve buttons */
            button {
                font-size: 14px !important;
                font-family: system-ui, -apple-system, sans-serif !important;
                letter-spacing: normal !important;
                line-height: 1.4 !important;
            }

            /* Fix for common icon fonts */
            [class^="icon-"], [class*=" icon-"] {
                font-family: inherit !important;
            }
        `;
        
        style.textContent = css;
        document.head.appendChild(style);

        // Save settings for future page loads
        chrome.storage.sync.set({ fontSettings: settings });
    }

    getSelectedText() {
        return window.getSelection().toString().trim();
    }

    showTranslationOverlay(translation, originalText) {
        const overlayId = 'text-enhancer-translation-overlay';
        let overlay = document.getElementById(overlayId);
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = overlayId;
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            <div class="te-overlay-content">
                <div class="te-overlay-header">
                    <span>Translation</span>
                    <button class="te-close-btn">&times;</button>
                </div>
                <div class="te-overlay-body">
                    <p class="te-original">"${originalText}"</p>
                    <p class="te-translated">${translation}</p>
                </div>
            </div>
            <style>
                #${overlayId} {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 999999;
                    max-width: 300px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                    font-family: system-ui, -apple-system, sans-serif !important;
                    animation: te-slide-in 0.3s ease-out;
                    color: #333;
                    border: 1px solid #eee;
                }
                .te-overlay-content { padding: 16px; }
                .te-overlay-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                    border-bottom: 1px solid #f0f0f0;
                    padding-bottom: 8px;
                }
                .te-overlay-header span { font-weight: bold; color: #667eea; }
                .te-close-btn {
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: #999;
                }
                .te-original { font-style: italic; color: #666; font-size: 12px; margin-bottom: 8px; }
                .te-translated { font-size: 16px; line-height: 1.4; font-weight: 500; }
                @keyframes te-slide-in {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
        `;

        overlay.querySelector('.te-close-btn').onclick = () => overlay.remove();
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (overlay.parentElement) overlay.remove();
        }, 10000);
    }

    readAloud(text) {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    }

    // Helper method to reset font settings
    resetFontSettings() {
        const styleId = 'text-enhancer-styles';
        const existingStyle = document.getElementById(styleId);
        if (existingStyle) {
            existingStyle.remove();
        }
        
        // Clear saved settings
        chrome.storage.sync.remove('fontSettings');
    }
}

// Initialize content script
new TextEnhancerContent();
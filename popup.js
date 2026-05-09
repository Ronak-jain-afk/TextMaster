// Popup JavaScript
(function() {
    class TextEnhancerPopup {
        constructor() {
            this.init();
            this.loadSettings();
        }

        init() {
            // Tab switching
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.switchTab(e.target.dataset.tab);
                });
            });

            // Font controls
            this.setupFontControls();
            
            // Translation controls
            this.setupTranslationControls();

            // TTS controls
            this.setupTTSControls();

            // Load selected text from current tab
            this.loadSelectedText();
        }

        setupTTSControls() {
            const ttsBtn = document.getElementById('tts-btn');
            const translationInput = document.getElementById('translation-input');
            const translationOutput = document.getElementById('translation-output');

            ttsBtn.addEventListener('click', () => {
                const textToRead = translationOutput.value || translationInput.value;
                if (!textToRead) {
                    this.showError('No text to read');
                    return;
                }

                if (window.speechSynthesis.speaking) {
                    window.speechSynthesis.cancel();
                    ttsBtn.textContent = 'Speak';
                    return;
                }

                const utterance = new SpeechSynthesisUtterance(textToRead);
                const targetLang = document.getElementById('target-language').value;
                utterance.lang = targetLang; 

                utterance.onstart = () => {
                    ttsBtn.textContent = 'Stop';
                };

                utterance.onend = () => {
                    ttsBtn.textContent = 'Speak';
                };

                window.speechSynthesis.speak(utterance);
            });
        }

        setupFontControls() {
            const fontSizeSlider = document.getElementById('font-size');
            const fontSizeValue = document.getElementById('font-size-value');
            const letterSpacingSlider = document.getElementById('letter-spacing');
            const letterSpacingValue = document.getElementById('letter-spacing-value');
            const lineHeightSlider = document.getElementById('line-height');
            const lineHeightValue = document.getElementById('line-height-value');
            const fontFamilySelect = document.getElementById('font-family');
            const darkModeToggle = document.getElementById('dark-mode-toggle');
            const applyFontBtn = document.getElementById('apply-font');
            const resetFontBtn = document.getElementById('reset-font');

            // Update value displays
            fontSizeSlider.addEventListener('input', () => {
                fontSizeValue.textContent = `${fontSizeSlider.value}px`;
            });

            letterSpacingSlider.addEventListener('input', () => {
                letterSpacingValue.textContent = `${letterSpacingSlider.value}px`;
            });

            lineHeightSlider.addEventListener('input', () => {
                lineHeightValue.textContent = lineHeightSlider.value;
            });

            // Apply font changes
            applyFontBtn.addEventListener('click', () => {
                const settings = {
                    fontSize: `${fontSizeSlider.value}px`,
                    fontFamily: fontFamilySelect.value,
                    letterSpacing: `${letterSpacingSlider.value}px`,
                    lineHeight: lineHeightSlider.value,
                    darkMode: darkModeToggle.checked
                };

                this.saveSettings(settings);
                this.applyFontSettings(settings);
            });

            // Reset to default
            resetFontBtn.addEventListener('click', () => {
                fontSizeSlider.value = 16;
                fontSizeValue.textContent = '16px';
                letterSpacingSlider.value = 0;
                letterSpacingValue.textContent = '0px';
                lineHeightSlider.value = 1.5;
                lineHeightValue.textContent = '1.5';
                fontFamilySelect.value = 'system-ui, -apple-system, sans-serif';
                darkModeToggle.checked = false;

                const defaultSettings = {
                    fontSize: '16px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    letterSpacing: '0px',
                    lineHeight: 1.5,
                    darkMode: false
                };

                this.saveSettings(defaultSettings);
                this.applyFontSettings(defaultSettings);
                this.showSuccess('Reset to defaults');
            });
        }

        setupTranslationControls() {
            const translateBtn = document.getElementById('translate-btn');
            const copyTranslationBtn = document.getElementById('copy-translation');
            const translationInput = document.getElementById('translation-input');
            const translationOutput = document.getElementById('translation-output');
            const targetLangSelect = document.getElementById('target-language');

            // Save preferred language when changed
            targetLangSelect.addEventListener('change', () => {
                chrome.storage.sync.set({ preferredLanguage: targetLangSelect.value });
            });

            translateBtn.addEventListener('click', async () => {
                const text = translationInput.value.trim();
                const targetLang = targetLangSelect.value;

                if (!text) {
                    this.showError('Select text to translate');
                    return;
                }

                translateBtn.classList.add('loading');
                translateBtn.textContent = 'Translating...';

                try {
                    const translation = await this.translateText(text, targetLang);
                    translationOutput.value = translation;
                    this.showSuccess('Translated');
                } catch (error) {
                    this.showError('Translation failed');
                } finally {
                    translateBtn.classList.remove('loading');
                    translateBtn.textContent = 'Translate';
                }
            });

            copyTranslationBtn.addEventListener('click', () => {
                if (translationOutput.value) {
                    navigator.clipboard.writeText(translationOutput.value);
                    this.showSuccess('Copied to clipboard');
                }
            });
        }

        switchTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            
            document.getElementById(`${tabName}-tab`).classList.add('active');
            document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        }

        async loadSelectedText() {
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!tab) return;

                chrome.tabs.sendMessage(tab.id, { action: 'getSelectedText' }, (response) => {
                    if (chrome.runtime.lastError) return;
                    if (response && response.text) {
                        document.getElementById('translation-input').value = response.text;
                    }
                });
            } catch (error) {
                console.error(error);
            }
        }

        async translateText(text, targetLang) {
            return new Promise((resolve, reject) => {
                const port = chrome.runtime.connect({name: "translateText"});
                port.postMessage({ action: 'translateText', text: text, targetLang: targetLang });
                
                port.onMessage.addListener((response) => {
                    if (response && response.success) {
                        resolve(response.translation);
                        port.disconnect();
                    } else {
                        reject(new Error(response?.error || 'Unknown error'));
                        port.disconnect();
                    }
                });
                
                port.onDisconnect.addListener(() => {
                    if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
                });
            });
        }

        applyFontSettings(settings) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (!tabs[0]) return;
                chrome.tabs.sendMessage(tabs[0].id, { action: 'applyFontSettings', settings: settings }, (response) => {
                    if (chrome.runtime.lastError) {
                        this.showError('Refresh page to apply');
                    } else {
                        this.showSuccess('Settings applied');
                    }
                });
            });
        }

        async saveSettings(settings) {
            await chrome.storage.sync.set({ fontSettings: settings });
        }

        async loadSettings() {
            const result = await chrome.storage.sync.get('fontSettings');
            if (result.fontSettings) {
                const s = result.fontSettings;
                document.getElementById('font-size').value = parseInt(s.fontSize);
                document.getElementById('font-size-value').textContent = s.fontSize;
                document.getElementById('letter-spacing').value = parseFloat(s.letterSpacing);
                document.getElementById('letter-spacing-value').textContent = s.letterSpacing;
                document.getElementById('line-height').value = parseFloat(s.lineHeight);
                document.getElementById('line-height-value').textContent = s.lineHeight;
                document.getElementById('font-family').value = s.fontFamily;
                document.getElementById('dark-mode-toggle').checked = s.darkMode || false;
            }
        }

        showSuccess(message) { this.showMessage(message, 'success'); }
        showError(message) { this.showMessage(message, 'error'); }

        showMessage(message, type) {
            const existing = document.querySelector('.success-message');
            if (existing) existing.remove();

            const messageDiv = document.createElement('div');
            messageDiv.className = `success-message ${type === 'error' ? 'error-message' : ''}`;
            messageDiv.textContent = message;
            document.body.appendChild(messageDiv);
            
            setTimeout(() => {
                messageDiv.style.opacity = '0';
                messageDiv.style.transform = 'translateY(10px)';
                setTimeout(() => messageDiv.remove(), 300);
            }, 2000);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        new TextEnhancerPopup();
    });
})();
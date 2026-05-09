// Background service worker
class TextEnhancerBackground {
    constructor() {
        this.init();
        
        // Set up connection listener for long-running operations
        chrome.runtime.onConnect.addListener((port) => {
            console.log('Connection established with name:', port.name);
            
            port.onMessage.addListener(async (msg) => {
                if (msg.action === 'translateText') {
                    try {
                        console.log('Handling translateText action');
                        const result = await this.translateText(msg.text, msg.targetLang);
                        console.log('Operation successful:', result);
                        port.postMessage({ success: true, translation: result });
                    } catch (error) {
                        console.error('Error during translateText:', error);
                        port.postMessage({ success: false, error: error.message });
                    }
                }
            });
            
            port.onDisconnect.addListener(() => {
                console.log('Port disconnected:', port.name);
            });
        });
    }

    init() {
        // Create context menu items
        this.createContextMenus();
        
        // Listen for context menu clicks
        chrome.contextMenus.onClicked.addListener(this.handleContextMenuClick.bind(this));
        
        // Listen for messages from content scripts
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    }

    createContextMenus() {
        // Remove existing menus if any
        chrome.contextMenus.removeAll(() => {
            // Create translate context menu
            chrome.contextMenus.create({
                id: 'translate-text',
                title: 'Translate selected text',
                contexts: ['selection']
            });

            // Create TTS context menu
            chrome.contextMenus.create({
                id: 'read-aloud',
                title: 'Read selected text aloud',
                contexts: ['selection']
            });
        });
    }

    async handleContextMenuClick(info, tab) {
        const selectedText = info.selectionText.trim();
        
        if (!selectedText) {
            return;
        }

        switch (info.menuItemId) {
            case 'translate-text':
                await this.handleTranslation(selectedText, tab);
                break;
            case 'read-aloud':
                this.handleReadAloud(selectedText, tab);
                break;
        }
    }

    handleReadAloud(text, tab) {
        chrome.tabs.sendMessage(tab.id, {
            action: 'readAloud',
            text: text
        });
    }

    async handleTranslation(text, tab) {
        try {
            // Get user's preferred language from storage
            const result = await chrome.storage.sync.get('preferredLanguage');
            const targetLang = result.preferredLanguage || 'en';

            const translation = await this.translateText(text, targetLang);
            
            // Send to content script for display
            chrome.tabs.sendMessage(tab.id, {
                action: 'showTranslation',
                translation: translation,
                originalText: text
            });

        } catch (error) {
            console.error('Translation error:', error);
        }
    }

    handleMessage(request, sender, sendResponse) {
        // ... (existing implementation)
    }

    async translateText(text, targetLang) {
        if (!text || !targetLang) return text;

        // Sequence of services
        const services = [
            async () => {
                const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
                const res = await this.fetchWithTimeout(url);
                const data = await res.json();
                return data[0].map(x => x[0]).join('').trim();
            },
            async () => {
                const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${targetLang}`;
                const res = await this.fetchWithTimeout(url);
                const data = await res.json();
                const trans = data.responseData.translatedText.trim();
                if (trans.includes('INVALID SOURCE LANGUAGE') || trans.includes('SELECT TWO DISTINCT LANGUAGES')) throw new Error('MyMemory logic error');
                return trans;
            }
        ];

        for (const service of services) {
            try {
                const translation = await service();
                if (translation && translation.toLowerCase() !== text.toLowerCase()) {
                    return translation;
                }
            } catch (e) {
                console.warn('Translation service failed, trying next...');
            }
        }

        // Final attempt with LibreTranslate mirrors
        const mirrors = [
            'https://translate.argosopentech.com/translate',
            'https://lt.vern.cc/translate',
            'https://libretranslate.de/translate'
        ];

        for (const url of mirrors) {
            try {
                const res = await this.fetchWithTimeout(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ q: text, source: 'auto', target: targetLang, format: 'text' })
                });
                const data = await res.json();
                const trans = data.translatedText.trim();
                if (trans && trans.toLowerCase() !== text.toLowerCase()) {
                    return trans;
                }
            } catch (e) {}
        }

        // If we got here, either all failed or the text is already in the target language
        return text;
    }

    async fetchWithTimeout(resource, options = {}) {
        const { timeout = 8000 } = options;
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    }

    // Cleanup on extension uninstall
    cleanup() {
        chrome.contextMenus.removeAll();
    }
}

// Initialize background service worker
const textEnhancer = new TextEnhancerBackground();

// Cleanup when extension is uninstalled
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        // First install - set default preferences
        chrome.storage.sync.set({
            preferredLanguage: 'en',
            fontSettings: {
                fontSize: '16px',
                fontFamily: 'Arial, sans-serif',
                letterSpacing: '0px',
                lineHeight: 1.5
            }
        });
    }
});

chrome.runtime.onSuspend.addListener(() => {
    textEnhancer.cleanup();
});
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
        console.log('Message received:', request.action);
        
        if (request.action !== 'translateText') {
            console.log('Unknown action:', request.action);
            sendResponse({ success: false, error: 'Unknown action' });
            return true;
        }
        
        return true;
    }

    async translateText(text, targetLang) {
        // First try Google's unofficial but stable API
        try {
            const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
            const response = await fetch(googleUrl);
            if (response.ok) {
                const data = await response.json();
                if (data && data[0] && data[0][0] && data[0][0][0]) {
                    return data[0][0][0];
                }
            }
        } catch (e) {
            console.warn('Google Translate fallback failed, trying LibreTranslate mirrors...');
        }

        const endpoints = [
            'https://translate.argosopentech.com/translate',
            'https://libretranslate.de/translate',
            'https://lt.vern.cc/translate'
        ];

        let lastError = null;

        for (const url of endpoints) {
            try {
                console.log(`Attempting translation with: ${url}`);
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        q: text,
                        source: 'auto',
                        target: targetLang,
                        format: 'text'
                    })
                });

                if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const data = await response.json();
                        if (data && data.translatedText) {
                            return data.translatedText;
                        }
                    } else {
                        console.warn(`Endpoint ${url} returned non-JSON content: ${contentType}`);
                    }
                }
                console.warn(`Endpoint ${url} failed with status: ${response.status}`);
            } catch (error) {
                console.warn(`Endpoint ${url} error:`, error);
                lastError = error;
            }
        }

        throw new Error(lastError ? lastError.message : 'All translation services failed');
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
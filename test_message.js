// Test script to verify background script message handling
console.log('Testing background script message handling...');

chrome.runtime.sendMessage({
    action: 'summarizeText',
    text: 'The Milky Way is a barred spiral galaxy with a D25 isophotal diameter estimated at 26.8 ± 1.1 kiloparsecs.',
    length: 'medium'
}, (response) => {
    console.log('Test response:', response);
    if (response && response.success) {
        console.log('Summary:', response.summary);
    } else if (response) {
        console.log('Error:', response.error);
    } else {
        console.log('No response received');
    }
});
// Safe message passing with dynamic injection fallback
function safeSendMessage(tabId, message) {
  chrome.tabs.sendMessage(tabId, message).catch(() => {
    // If the content script is missing (e.g. extension just installed but tab wasn't reloaded)
    // We dynamically inject it, along with the CSS, and then send the message again.
    chrome.scripting.insertCSS({
      target: { tabId },
      files: ['content.css']
    }).catch(() => {}); // Catch if CSS fails

    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    }, () => {
      // Small timeout to allow the script to initialize its listeners
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, message).catch(err => console.error(err));
      }, 100);
    });
  });
}

// Create Context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "read-with-red-point",
    title: "Read with Red Point Elite",
    contexts: ["selection"]
  });
});

// Listen to context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "read-with-red-point" && info.selectionText) {
    safeSendMessage(tab.id, {
      action: "START_RSVP",
      text: info.selectionText
    });
  }
});

// Listen to Extension Icon clicks (Full Page Mode)
chrome.action.onClicked.addListener((tab) => {
  safeSendMessage(tab.id, {
    action: "EXTRACT_AND_START"
  });
});

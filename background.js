chrome.cookies.onChanged.addListener(function(info) {
    console.log("cookies.onChanged", JSON.stringify(info));
  });
  
  function focusOrCreateTab(url) {
    chrome.windows.getAll({ "populate": true }, function(windows) {
      let existing_tab = null;
      for (let window of windows) {
        for (let tab of window.tabs) {
          if (tab.url === url) {
            existing_tab = tab;
            break;
          }
        }
      }
      if (existing_tab) {
        chrome.tabs.update(existing_tab.id, { "selected": true });
      } else {
        chrome.tabs.create({ "url": url, "selected": true });
      }
    });
  }
  
  chrome.action.onClicked.addListener(function(tab) {
    let manager_url = chrome.runtime.getURL("popup.html");
    focusOrCreateTab(manager_url);
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "kurationLogout") {
        removeKurationCookies();
        
        // Optional: Redirect to login page or close tabs
        chrome.tabs.query({url: "https://app.kurationai.com/*"}, function(tabs) {
            if (tabs && tabs.length > 0) {
                tabs.forEach(tab => {
                    chrome.tabs.remove(tab.id);
                });
            }
        });
    }
});

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url.includes('kurationai.com')) {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            function: () => {
                // Detect login
                function detectLogin() {
                    const loginIndicator = document.querySelector('.user-logged-in'); // Adjust selector
                    if (loginIndicator) {
                        chrome.runtime.sendMessage({ type: "kurationLogin" });
                    }
                }

                // Detect logout
                function detectLogout() {
                    const logoutIndicator = document.querySelector('.user-logged-out'); // Adjust selector
                    if (logoutIndicator) {
                        chrome.runtime.sendMessage({ type: "kurationLogout" });
                    }
                }

                // Run detection
                detectLogin();
                detectLogout();
            }
        });
    }
});
  
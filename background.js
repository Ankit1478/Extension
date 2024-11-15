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
  
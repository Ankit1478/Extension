document.addEventListener("DOMContentLoaded", function() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const salescookieText = document.getElementById('sales-cookie');
    const eventCookies =  document.getElementById("event-cookie");
    const copyButtons = document.querySelectorAll('.copy-button');
    const salesurlInput = document.getElementById('sales-url');
    const eventurlInput = document.getElementById('event-url');
    const kurationtext = document.getElementById("kuration");
    const ScrapEventBtn = document.getElementById('eventbtn')
    const mainContent = document.querySelector('.scraper-container');
    const cookieConsent = document.getElementById('cookieConsent');
    const acceptButton = document.getElementById('acceptCookies');
    const rejectButton = document.getElementById('rejectCookies');
    const kurationText = document.getElementById('kuration');
    const kurationOverlay = document.getElementById('kurationSignupOverlay');
    const kurationSignupBtn = document.getElementById('kurationSignupBtn');

    
   
    // Function to check and manage Kuration cookie
    function checkKurationCookie() {
        return new Promise((resolve) => {
            chrome.cookies.getAll({
                domain: ".kurationai.com"  
            }, function(cookies) {
                const ugeuidCookie = cookies.find(cookie => cookie.name === "_ugeuid");
                
                if (ugeuidCookie) {
                    // Cookie exists, update text and hide overlay
                    kurationText.textContent = ugeuidCookie.value;
                    kurationOverlay.classList.remove('show');
                    resolve(true);
                } else {
                    // No cookie found, show overlay
                    kurationText.textContent = 'Please log in to Kuration';
                    kurationOverlay.classList.add('show');
                    resolve(false);
                }
            });
        });
    }

    // Function to clear Kuration cookies
    function clearKurationCookies() {
        chrome.cookies.getAll({
            domain: ".kurationai.com"
        }, function(cookies) {
            cookies.forEach(function(cookie) {
                const url = "https://" + cookie.domain + cookie.path;
                chrome.cookies.remove({
                    url: url,
                    name: cookie.name
                });
            });
        });
    }

    // Initial cookie check
    checkKurationCookie();

    // Signup button handler
    kurationSignupBtn.addEventListener('click', function() {
        // Open Kuration signup page
        chrome.tabs.create({ 
            url: 'https://witty-rock-04372ec1e.5.azurestaticapps.net/login',
            active: true 
        });
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === "kurationLogin") {
          
            checkKurationCookie();
        } else if (message.type === "kurationLogout") {
            
            clearKurationCookies();
            checkKurationCookie();
        }
    });

   
    setInterval(checkKurationCookie, 5000);
    
    function initializeCookieConsent() {
        if (cookieConsent && acceptButton && rejectButton) {
            chrome.storage.local.get(['cookieConsent'], function (result) {
                if (chrome.runtime.lastError) {
                    console.error('Error reading from storage:', chrome.runtime.lastError);
                    return;
                }
    
                
                if (result.cookieConsent === undefined || result.cookieConsent === false) {
                    cookieConsent.style.transform = 'translateY(0)';
                } else if (result.cookieConsent === true) {
                    initializeExtensionFeatures();
                }
            });
    
            acceptButton.addEventListener('click', function () {
                chrome.storage.local.set(
                    {
                        cookieConsent: true,
                        timestamp: Date.now()
                    },
                    function () {
                        if (chrome.runtime.lastError) {
                            console.error('Error saving to storage:', chrome.runtime.lastError);
                            showError("Failed to save cookie consent");
                            return;
                        }
                        cookieConsent.style.transform = 'translateY(100%)';
                        initializeExtensionFeatures();
                    }
                );
            });
    
            rejectButton.addEventListener('click', function () {
                chrome.storage.local.set(
                    {
                        cookieConsent: false
                    },
                    function () {
                        if (chrome.runtime.lastError) {
                            console.error('Error saving to storage:', chrome.runtime.lastError);
                            showError("Failed to save cookie consent");
                            return;
                        }
                        cookieConsent.style.transform = 'translateY(100%)';
                        showNotification("Cookie access is required for extension functionality. Please accept cookies when reopening the extension.");
                    }
                );
            });
        }
    }
    

    initializeCookieConsent();
    

    
   
    function initializeExtensionFeatures() {
        initializeExtensionForSales();
        initializeExtensionForEvent();
        getKurationCookie();
        
        // Tab switching functionality
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tabId).classList.add('active');
            });
        });

    }
    

    
    getKurationCookie();
   
    tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
    
                // Remove active class from all tabs and contents
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
    
                // Add active class to clicked tab and corresponding content
                tab.classList.add('active');
                document.getElementById(tabId).classList.add('active');
            });
    });
    
   
    copyButtons.forEach(button => {
        button.addEventListener('click', () => {
        const input = button.previousElementSibling;
        input.select();
        document.execCommand('copy');

        // Add green tick SVG
        const originalSvg = button.querySelector('svg');
        const greenTickSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        greenTickSvg.setAttribute('viewBox', '0 0 24 24');
        greenTickSvg.innerHTML = `
            <path fill="#4CAF50" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        `;
        
        // Replace original SVG with green tick
        button.replaceChild(greenTickSvg, originalSvg);

        // Chrome Extension specific notification
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                type: "showNotification",
                message: "Copied to clipboard!"
            });
        });

        // Revert back to original SVG after 1 second
        setTimeout(() => {
            button.replaceChild(originalSvg, greenTickSvg);
        }, 1000);
    });
    });
   
    function showNotification(message, isError = false) {
        const notification = document.getElementById('notification');
        const messageContainer = document.getElementById('notification-message');

        // Set message and styles
        messageContainer.textContent = message;
        notification.classList.remove('hidden', 'show', 'error');
        if (isError) {
            notification.classList.add('error');
        }
        
        // Show notification
        notification.classList.add('show');
    
        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    ScrapEventBtn.addEventListener("click", handleScrape);

    async function initializeExtensionForEvent() {
        try {
            const allTabs = await getAllTabs();
            const linkedInTab = allTabs.find(tab => tab.url.startsWith("https://www.linkedin.com/search/results/events/"));
            
            if (linkedInTab) {
                eventurlInput.value = linkedInTab.url;
            } else {
                eventurlInput.value = "Login to LinkedIn Events";
            }
            await getLinkedInEventCookie();
            
        } catch (error) {
            console.error('Initialization error:', error);
            showError('Failed to initialize extension');
        }
    }


    async function initializeExtensionForSales() {
        try {
            const allTabs = await getAllTabs();
            const linkedInTab = allTabs.find(tab => tab.url.startsWith("https://www.linkedin.com/sales/search/"));
            
            if (linkedInTab) {
                salesurlInput.value = linkedInTab.url;
            } else {
                salesurlInput.value = "Login to LinkedIn Sales";
            }
            await getLinkedInsalesCookie();
            // await getKurationCookie();  
            
        } catch (error) {
            console.error('Initialization error:', error);
            showError('Failed to initialize extension');
        }
    }

    async function getAllTabs() {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({}, function (tabs) {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(tabs);
                }
            });
        });
    }
    
    async function getLinkedInEventCookie() {
        return new Promise((resolve) => {
            chrome.cookies.getAll({
                domain: ".linkedin.com"  
            }, function(cookies) {
                const liAtCookie = cookies.find(cookie => cookie.name === "li_at");
                if (liAtCookie) {
                    eventCookies.value = liAtCookie.value;
                    resolve(liAtCookie.value);
                } else {
                    eventCookies.value = "Please log in to LinkedIn";
                    resolve(null);
                }
            });
        });
    }

    async function getLinkedInsalesCookie() {
        return new Promise((resolve) => {
            chrome.cookies.getAll({
                domain: ".linkedin.com"  
            }, function(cookies) {
                const liAtCookie = cookies.find(cookie => cookie.name === "li_at");
                if (liAtCookie) {
                    salescookieText.value = liAtCookie.value;
                    resolve(liAtCookie.value);
                } else {
                    salescookieText.value = "Please log in to LinkedIn";
                    resolve(null);
                }
            });
        });
    }

    async function getKurationCookie() {
        return new Promise((resolve) => {
            chrome.cookies.getAll({
                domain: ".kurationai.com"  
            }, function(cookies) {
                const liAtCookie = cookies.find(cookie => cookie.name === "_ugeuid");
                if (liAtCookie) {
                    kurationtext.textContent = liAtCookie.value;
                    resolve(liAtCookie.value);
                } else {
                    kurationtext.textContent = "Please log in to Kuration";
                    resolve(null);
                }
            });
        });
    }

    function handleScrape() {
        console.log('Button clicked');
        const cookie = eventCookies.value;
        const url = eventurlInput.value;
        const kurationValue = kurationtext.textContent

        if (!url || !url.includes('linkedin.com')) {
            showError("Please login to a LinkedIn page");
            return;
        }

        if (!cookie || cookie === "Please log in to LinkedIn") {
            showError("Please log in to LinkedIn first");
            return;
        }

        if (!kurationValue || kurationValue === "Log in to Kuration") {
            showError("Please log in to Kuration first");
            return;
        }

        sendToScraper(cookie, url, kurationValue);
    }

    function sendToScraper(cookie, url, kuration) {
        try {
            const encodedCookie = encodeURIComponent(cookie);
            const encodedUrl = encodeURIComponent(url);
            const encodedKurationCookie = encodeURIComponent(kuration);
            const frontendUrl = `http://localhost:5173/scrape?cookie=${encodedCookie}&url=${encodedUrl}&kuration=${encodedKurationCookie}`;
            
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0]) {
                    chrome.tabs.update(tabs[0].id, {url: frontendUrl}, function(tab) {
                        if (chrome.runtime.lastError) {
                            showError("Failed to update scraper page");
                        }
                    });
                } else {
                    showError("No active tab found");
                }
            });
        } catch (error) {
            console.error('Error sending to scraper:', error);
            showError("Failed to start scraping");
        }
    }

    function showError(message) {
        alert(message);
    }
    initializeCookieConsent()
});
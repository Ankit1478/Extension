document.addEventListener("DOMContentLoaded", function() {
    const cookieText = document.getElementById("cookieText");
    const urlInput = document.getElementById("urlInput");
    const scrapeButton = document.getElementById("scrapeButton");
    const clipboardButtons = document.querySelectorAll('.clipboard-icon');
    
    initializeExtension();
    // This is the function that will be called when the user clicks on the clipboard icon
    clipboardButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const targetId = this.getAttribute('data-target');
            const textToCopy = document.getElementById(targetId).textContent;
            
            try {
                await navigator.clipboard.writeText(textToCopy);
               
                this.classList.add('copied');
                const clipboardIcon = this.querySelector('.clipboard');
                const tickIcon = this.querySelector('.tick');
                
                if (clipboardIcon && tickIcon) {
                    clipboardIcon.style.display = 'none';
                    tickIcon.style.display = 'block';
                    
                    setTimeout(() => {
                        this.classList.remove('copied');
                        clipboardIcon.style.display = 'block';
                        tickIcon.style.display = 'none';
                    }, 2000);
                }
            } catch (err) {
                console.error('Failed to copy:', err);
                showError('Failed to copy to clipboard');
            }
        });
    });
    //it will start scraping when the user clicks on the scrape button
    scrapeButton.addEventListener("click", handleScrape);

    async function initializeExtension() {
        try {
            const tab = await getCurrentTab();
            if (tab?.url) {
                urlInput.textContent = tab.url;
            } else {
                urlInput.textContent = "Please navigate to LinkedIn";
            }

            await getLinkedInCookie();
            
        } catch (error) {
            console.error('Initialization error:', error);
            showError('Failed to initialize extension');
        }
    }

    //this is a function that will return the current tab
    async function getCurrentTab() {
        return new Promise((resolve) => {
            chrome.tabs.query({
                active: true,
                currentWindow: true
            }, function(tabs) {
                resolve(tabs[0]);
            });
        });
    }
  //this is a function that will return the cookie of the current tab
    async function getLinkedInCookie() {
        return new Promise((resolve) => {
            chrome.cookies.getAll({
                domain: ".linkedin.com"  
            }, function(cookies) {
                const liAtCookie = cookies.find(cookie => cookie.name === "li_at");
                if (liAtCookie) {
                    cookieText.textContent = liAtCookie.value;
                    resolve(liAtCookie.value);
                } else {
                    cookieText.textContent = "Please log in to LinkedIn";
                    resolve(null);
                }
            });
        });
    }

    function handleScrape() {
        const cookie = cookieText.textContent;
        const url = urlInput.textContent;

        if (!url || !url.includes('linkedin.com')) {
            showError("Please navigate to a LinkedIn page");
            return;
        }

        if (!cookie || cookie === "Please log in to LinkedIn") {
            showError("Please log in to LinkedIn first");
            return;
        }

        sendToScraper(cookie, url);
    }

    //sending data to kuration Data if click on button
    function sendToScraper(cookie, url) {
        try {
            const encodedCookie = encodeURIComponent(cookie);
            const encodedUrl = encodeURIComponent(url);
            const frontendUrl = `http://localhost:5173/scrape?cookie=${encodedCookie}&url=${encodedUrl}`;
            
            chrome.tabs.create({ url: frontendUrl }, function(tab) {
                if (chrome.runtime.lastError) {
                    showError("Failed to open scraper page");
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
});
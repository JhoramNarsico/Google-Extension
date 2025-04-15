let myLeads = [];
const inputEl = document.getElementById("input-el");
const inputBtn = document.getElementById("input-btn");
const ulEl = document.getElementById("ul-el");
const deleteBtn = document.getElementById("delete-btn");
const tabBtn = document.getElementById("tab-btn");
const searchEl = document.getElementById("search-el");
const categoryEl = document.getElementById("category-el");

// Load leads from local storage
loadLeads();

/**
 * Validates if a string is a valid URL
 * @param {string} string - The URL to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidURL(string) {
    try {
        new URL(string.startsWith('http') ? string : `https://${string}`);
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * Sanitizes a URL to prevent XSS
 * @param {string} url - The URL to sanitize
 * @returns {string} - Sanitized URL
 */
function sanitizeURL(url) {
    const div = document.createElement("div");
    div.textContent = url;
    return div.innerHTML;
}

/**
 * Displays an error message temporarily
 * @param {string} message - The error message to show
 */
function showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    ulEl.prepend(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

/**
 * Loads leads from localStorage
 */
function loadLeads() {
    try {
        const leadsFromLocalStorage = JSON.parse(localStorage.getItem("myLeads"));
        if (leadsFromLocalStorage) {
            myLeads = leadsFromLocalStorage;
            render(myLeads);
        }
    } catch (error) {
        showError("Failed to load leads. Storage cleared.");
        localStorage.removeItem("myLeads");
    }
}

/**
 * Debounces a function to limit execution rate
 * @param {Function} func - The function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Event listener for search input
searchEl.addEventListener("input", debounce(function() {
    const query = searchEl.value.toLowerCase();
    const filteredLeads = myLeads.filter(lead => 
        lead.url.toLowerCase().includes(query) || 
        (new URL(lead.url).hostname.toLowerCase().includes(query))
    );
    render(filteredLeads);
}, 300));

// Event listener for "Save Tab" button
tabBtn.addEventListener("click", function() {
    tabBtn.classList.add("loading");
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs && tabs[0] && tabs[0].url) {
                const url = tabs[0].url;
                if (!myLeads.some(lead => lead.url === url)) {
                    myLeads.push({ url, category: categoryEl.value });
                    saveAndRender();
                } else {
                    showError("This URL is already saved!");
                }
            } else {
                showError("Couldn't access current tab URL.");
            }
            tabBtn.classList.remove("loading");
        });
    } else {
        showError("This feature only works as a Chrome extension.");
        tabBtn.classList.remove("loading");
    }
});

// Event listener for "Save Input" button
inputBtn.addEventListener("click", function() {
    saveInput();
});

// Event listener for Enter key in input field
inputEl.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        saveInput();
    }
});

/**
 * Saves input URL with category
 */
function saveInput() {
    inputBtn.classList.add("loading");
    const inputValue = inputEl.value.trim();
    if (inputValue === "") {
        showError("Please enter a URL");
        inputBtn.classList.remove("loading");
        return;
    }
    let formattedInput = inputValue;
    if (!inputValue.startsWith("http://") && !inputValue.startsWith("https://")) {
        formattedInput = "https://" + inputValue;
    }
    if (!isValidURL(formattedInput)) {
        showError("Please enter a valid URL");
        inputBtn.classList.remove("loading");
        return;
    }
    if (!myLeads.some(lead => lead.url === formattedInput)) {
        myLeads.push({ url: formattedInput, category: categoryEl.value });
        inputEl.value = "";
        saveAndRender();
    } else {
        showError("This URL is already saved!");
        inputEl.value = "";
    }
    inputBtn.classList.remove("loading");
}

// Event listener for "Delete All" button
deleteBtn.addEventListener("dblclick", function() {
    if (myLeads.length > 0) {
        if (confirm("Are you sure you want to delete all saved leads?")) {
            localStorage.clear();
            myLeads = [];
            render(myLeads);
        }
    } else {
        showError("No leads to delete!");
    }
});

/**
 * Saves to localStorage and renders
 */
function saveAndRender() {
    localStorage.setItem("myLeads", JSON.stringify(myLeads));
    render(myLeads);
}

/**
 * Renders leads to the UI
 * @param {Array} leads - Array of lead objects
 */
function render(leads) {
    const fragment = document.createDocumentFragment();
    const tempUl = document.createElement("ul");
    tempUl.setAttribute("role", "list");
    
    if (leads.length === 0) {
        const p = document.createElement("p");
        p.className = "no-leads";
        p.textContent = "No saved leads yet. Add some using the input field or 'Save Tab' button!";
        tempUl.appendChild(p);
    } else {
        leads.forEach((lead, i) => {
            const safeURL = sanitizeURL(lead.url);
            let displayText = safeURL;
            try {
                const url = new URL(safeURL);
                displayText = url.hostname;
            } catch (e) {}
            const li = document.createElement("li");
            li.innerHTML = `
                <a target='_blank' href='${safeURL}' title='${safeURL} (${lead.category})'>
                    ${displayText} <span class='category'>${lead.category}</span>
                </a>
                <button class='delete-lead' data-index='${i}' aria-label='Delete ${displayText}'>×</button>
            `;
            tempUl.appendChild(li);
        });
    }
    
    fragment.appendChild(tempUl);
    ulEl.innerHTML = "";
    ulEl.appendChild(fragment);
    
    // Add event listeners for individual lead deletion
    document.querySelectorAll('.delete-lead').forEach(button => {
        button.addEventListener('click', function(e) {
            const index = parseInt(e.target.getAttribute('data-index'));
            myLeads.splice(index, 1);
            saveAndRender();
            e.stopPropagation();
        });
    });
}
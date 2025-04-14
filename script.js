let myLeads = [];
const inputEl = document.getElementById("input-el");
const inputBtn = document.getElementById("input-btn");
const ulEl = document.getElementById("ul-el");
const deleteBtn = document.getElementById("delete-btn");
const tabBtn = document.getElementById("tab-btn");

// Load leads from local storage
loadLeads();

// Function to load leads from localStorage
function loadLeads() {
    try {
        const leadsFromLocalStorage = JSON.parse(localStorage.getItem("myLeads"));
        if (leadsFromLocalStorage) {
            myLeads = leadsFromLocalStorage;
            render(myLeads);
        }
    } catch (error) {
        console.error("Error loading leads from localStorage:", error);
        // If corrupted data, clear it
        localStorage.removeItem("myLeads");
    }
}

// Event listener for "Save Tab" button
tabBtn.addEventListener("click", function() {
    // Make sure we're in a Chrome extension environment
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs && tabs[0] && tabs[0].url) {
                // Don't add duplicates
                if (!myLeads.includes(tabs[0].url)) {
                    myLeads.push(tabs[0].url);
                    saveAndRender();
                } else {
                    alert("This URL is already saved!");
                }
            } else {
                alert("Couldn't access current tab URL.");
            }
        });
    } else {
        alert("This feature only works when running as a Chrome extension.");
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

// Function to save input value
function saveInput() {
    const inputValue = inputEl.value.trim();
    
    if (inputValue === "") {
        alert("Please enter a URL");
        return;
    }
    
    // Add http:// prefix if not present
    let formattedInput = inputValue;
    if (!inputValue.startsWith("http://") && !inputValue.startsWith("https://")) {
        formattedInput = "https://" + inputValue;
    }
    
    // Don't add duplicates
    if (!myLeads.includes(formattedInput)) {
        myLeads.push(formattedInput);
        inputEl.value = "";
        saveAndRender();
    } else {
        alert("This URL is already saved!");
        inputEl.value = "";
    }
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
        alert("No leads to delete!");
    }
});

// Function to save to localStorage and render
function saveAndRender() {
    localStorage.setItem("myLeads", JSON.stringify(myLeads));
    render(myLeads);
}

// Function to render leads
function render(leads) {
    let listItems = "";
    
    if (leads.length === 0) {
        // Show message when no leads
        ulEl.innerHTML = "<p class='no-leads'>No saved leads yet. Add some using the input field or 'Save Tab' button!</p>";
        return;
    }
    
    for (let i = 0; i < leads.length; i++) {
        // Get domain for display
        let displayText = leads[i];
        try {
            const url = new URL(leads[i]);
            displayText = url.hostname;
        } catch (e) {
            // Use full URL if parsing fails
        }
        
        listItems += `
            <li>
                <a target='_blank' href='${leads[i]}' title='${leads[i]}'>
                    ${displayText}
                </a>
                <span class="delete-lead" data-index="${i}">×</span>
            </li>
        `;
    }
    
    ulEl.innerHTML = listItems;
    
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

// Add some styling for the delete buttons
const style = document.createElement('style');
style.textContent = `
    .no-leads {
        color: #888;
        text-align: center;
        font-style: italic;
    }
    
    li {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .delete-lead {
        color: #999;
        font-size: 18px;
        cursor: pointer;
        padding: 0 5px;
    }
    
    .delete-lead:hover {
        color: #ff4444;
    }
`;
document.head.appendChild(style);
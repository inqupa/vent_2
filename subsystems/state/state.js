// Phase 1.1 Refactor: Implement State Namespacing
const initialState = {
    // userState namespace
    user: {
        name: "User Name",
        bio: "Short bio goes here.",
        email: "user@example.com"
    },
    // uiState namespace
    ui: {
        theme: localStorage.getItem('theme') || "light",
        dismissedSuggestion: localStorage.getItem('dismissedSuggestion') === 'true'
    },
    // dataState namespace
    data: {
        visitCount: parseInt(localStorage.getItem('visitCount')) || 0
    },
    // Phase 1.1: Create a Subscriber Registry
    subscribers: [] 
};

function updateUI(property, value) {
    if (property === "theme") {
        if (document.body) {
            document.body.setAttribute('data-theme', value);
            localStorage.setItem('theme', value);
        }
        return;
    }
    
    if (property === "visitCount") {
        localStorage.setItem('visitCount', value);
        return;
    }

    if (property === "dismissedSuggestion") {
        localStorage.setItem('dismissedSuggestion', value);
    }

    const element = document.getElementById(`sig-${property}`);
    if (element) { element.textContent = value; }
}

function createPersistentState(state) {
    return new Proxy(state, {
        set(target, property, value) {
            target[property] = value;
            updateUI(property, value);
            window.dispatchEvent(new Event('stateChange'));
            return true;
        }
    });
}

window.appState = createPersistentState(initialState);

// Time-Based Auto-Detection
function applyTimeTheme() {
    // Only auto-suggest if no manual theme is saved yet
    if (!localStorage.getItem('theme')) {
        const hour = new Date().getHours();
        const suggestedTheme = (hour < 6 || hour > 18) ? "dark" : "light";
        window.appState.theme = suggestedTheme;
    }
}

// Global Execution on Load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        updateUI("theme", window.appState.theme); 
        applyTimeTheme();
    });
} else {
    updateUI("theme", window.appState.theme);
    applyTimeTheme();
}
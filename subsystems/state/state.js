// 1. Try to load existing state from the hard drive first
const savedState = localStorage.getItem('vent_app_state');
const parsedState = savedState ? JSON.parse(savedState) : {};

// 2. Define initialState, merging saved data if it exists
let initialState = {
    user: { name: "", bio: "", email: "", ...(parsedState.user || {}) },
    ui: { theme: "light", dismissedSuggestion: false, ...(parsedState.ui || {}) },
    data: { visitCount: 0, ...(parsedState.data || {}) },
    subscribers: [] 
};

// FIX: Always re-attach the empty subscribers array on every page load
// because it cannot be (and was not) saved to localStorage.
initialState.subscribers = [];

// 3. Create the Proxy immediately
window.appState = createPersistentState(initialState);

async function loadInitialState() {
    const saved = localStorage.getItem('app_state_exists');
    if (!saved) {
        try {
            const response = await fetch('/data/default_state.json');
            const defaults = await response.json();
            // Deep merge defaults into initialState
            Object.assign(initialState.user, defaults.user);
            Object.assign(initialState.ui, defaults.ui);
            Object.assign(initialState.data, defaults.data);
            localStorage.setItem('app_state_exists', 'true');
        } catch (e) {
            console.error("Failed to load state snapshot:", e);
        }
    }
}

function updateUI(prop, val) {
    if (prop === 'theme') {
        // Ensure document.documentElement is used for global data-theme attribute
        if (val === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    }

    // Existing logic for other signals...
    const elements = document.querySelectorAll(`[id^="sig-${prop}"]`);
    elements.forEach(el => {
        el.textContent = val;
    });
}

function createPersistentState(state) {
    const handler = {
        get(target, property) {
            const value = target[property];
            if (value && typeof value === 'object' && property !== 'subscribers') {
                // Pass a reference to the namespace name (e.g., 'user') to the child proxy
                return new Proxy(value, handler);
            }
            return value;
        },
        set(target, property, value) {
            target[property] = value;

            // Phase 2.3: Improved Broadcast Logic
            if (window.appState && window.appState.subscribers) {
                window.appState.subscribers.forEach(sub => {
                    // This checks if the changed property matches the subscriber's key
                    // OR if the subscriber is watching the parent namespace
                    if (sub.key === property || sub.key === '*' || sub.key === 'user' || sub.key === 'data' || sub.key === 'ui' || property === 'theme') {
                        try {
                            sub.callback(property, value);
                        } catch (err) {
                            console.error("Subscriber execution failed:", err);
                        }
                    }
                });
            }

            // NEW: Save the entire state object to localStorage automatically on every change
            // We exclude subscribers since functions cannot be saved to JSON
            const stateToSave = {
                user: window.appState.user,
                ui: window.appState.ui,
                data: window.appState.data
            };
            localStorage.setItem('vent_app_state', JSON.stringify(stateToSave));

            window.dispatchEvent(new Event('stateChange'));
            return true;
        }
    };
    return new Proxy(state, handler);
}

// Time-Based Auto-Detection
function applyTimeTheme() {
    // Only auto-suggest if no manual theme is saved yet
    if (!localStorage.getItem('theme')) {
        const hour = new Date().getHours();
        const suggestedTheme = (hour < 6 || hour > 18) ? "dark" : "light";
        window.appState.ui.theme = suggestedTheme;
    }
}

// Phase 1.3: Enhanced Selective Subscription Helper
window.subscribeToState = (key, callback) => {
    if (typeof callback === 'function') {
        // Store the callback along with the key it cares about
        window.appState.subscribers.push({ key, callback });
        console.log(`Phase 1.3: Registered selective subscriber for [${key}]`);
    }
};

async function startStateSystem() {
    // Load defaults asynchronously
    await loadInitialState(); 

    // Register core theme subscribers
    window.subscribeToState('theme', (prop, val) => {
        updateUI(prop, val);
    });

    // PERSISTENCE FIX: Apply the current theme immediately
    // Access the live value from your namespaced state
    const currentTheme = window.appState.ui.theme || localStorage.getItem('theme');
    if (currentTheme) {
        updateUI('theme', currentTheme);
    }

    // 5. Run auto-detection
    applyTimeTheme();

    console.log("Phase 1.1: State System Populated");
}

// Start the loading process
startStateSystem();

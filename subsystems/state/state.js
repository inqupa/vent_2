// Phase 1.1: Global State Object
const initialState = {
    user: {
        name: "User Name",
        email: "user@example.com",
        location: "City, Country",
        bio: "Short bio or user description goes here.",
        joined: "January 2026",
        isLoggedIn: false,
        visitCount: 0
    },
    ui: {
        theme: "light",
        currentView: "landing"
    }
};

// Phase 1.2: Basic Listener Implementation
// This function uses a Proxy to "listen" for changes and log them[cite: 72, 73, 86].
function createPersistentState(state) {
    return new Proxy(state, {
        set(target, property, value) {
            console.log(`%c State Change Detected: ${property} updated to:`, "color: #007bff; font-weight: bold;", value);
            target[property] = value;
            return true;
        }
    });
}

// CRITICAL: Initialize appState as a Proxy to enable listening [cite: 70, 83]
window.appState = createPersistentState(initialState);

console.log("Global State & Listener Initialized. Try testing in the console!");
// Phase 1.1: Global State Object Initialization
// This object holds all user data and UI preferences centrally.
window.appState = {
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
        theme: "light", // 'light' or 'dark'
        currentView: "landing"
    }
};

console.log("Global State Initialized:", window.appState);
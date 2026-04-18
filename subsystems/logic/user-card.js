// subsystems/logic/user-card.js
class UserCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        if (window.subscribeToState) {
            window.subscribeToState('user', () => this.render());
        }
        this.render();
    }

    render() {
        const nameData = window.appState?.user?.name || "Guest Venturer";
        const bioData = window.appState?.user?.bio || "New to the Think Tank.";

        const style = `
            .header { display: flex; flex-direction: column; align-items: center; margin-bottom: 20px; }
            .profile-picture { width: 150px; height: 150px; background-color: var(--bg-color); border-radius: 50%; margin-bottom: 20px; }
            .username { margin: 10px 0; color: var(--user-card-text); font-family: sans-serif; }
            .bio { color: var(--user-card-text); font-family: sans-serif; opacity: 0.8; }
        `;

        this.shadowRoot.innerHTML = `
            <style>${style}</style>
            <div class="header">
                <div class="profile-picture"></div>
                <h1 class="username">${nameData}</h1>
                <p class="bio">${bioData}</p>
            </div>
        `;
    }
}
customElements.define('user-card', UserCard);
// subsystems/logic/user-card.js
class UserCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    async connectedCallback() {
        this.renderLoading();
        await this.loadUserData();
    }

    async loadUserData() {
        try {
            const response = await fetch('/api/user/me');
            if (!response.ok) {
                if (response.status === 401) {
                    // Redirect to login if not authenticated
                    window.location.href = '/skeleton/auth_placeholder.html';
                    return;
                }
                throw new Error('Failed to load profile');
            }
            const data = await response.json();
            this.render(data);
        } catch (err) {
            console.error(err);
            this.renderError();
        }
    }

    renderLoading() {
        this.shadowRoot.innerHTML = `<p style="text-align: center; color: var(--text-primary); font-family: sans-serif;">Loading profile data...</p>`;
    }

    renderError() {
        this.shadowRoot.innerHTML = `<p style="text-align: center; color: red; font-family: sans-serif;">Error loading profile.</p>`;
    }

    render(userData) {
        if (!userData) return;

        const joinedDate = new Date(userData.joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const initial = userData.email.charAt(0).toUpperCase();

        const style = `
            .header { display: flex; flex-direction: column; align-items: center; border-bottom: 1px solid rgba(128,128,128,0.2); padding-bottom: 20px; }
            .profile-picture { width: 100px; height: 100px; background-color: var(--accent-color); border-radius: 50%; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem; font-family: sans-serif; font-weight: bold; }
            .username { margin: 5px 0; color: var(--text-primary); font-family: sans-serif; font-size: 1.8rem; text-transform: capitalize; }
            .role { color: var(--accent-color); font-family: sans-serif; font-weight: bold; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; }
            
            .details-grid { display: grid; grid-template-columns: 1fr; gap: 15px; margin-top: 20px; font-family: sans-serif; color: var(--text-primary); }
            .detail-item { display: flex; justify-content: space-between; background: var(--bg-color); padding: 12px 15px; border-radius: 8px; }
            .detail-label { font-weight: bold; opacity: 0.8; }
            
            .logout-btn { margin-top: 30px; width: 100%; padding: 12px; background: transparent; border: 2px solid var(--accent-color); color: var(--text-primary); border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.2s; }
            .logout-btn:hover { background: var(--accent-color); color: white; }
        `;

        this.shadowRoot.innerHTML = `
            <style>${style}</style>
            <div class="header">
                <div class="profile-picture">${initial}</div>
                <h1 class="username">${userData.name}</h1>
                <div class="role">Think Tank Member</div>
            </div>
            <div class="details-grid">
                <div class="detail-item">
                    <span class="detail-label">Email</span>
                    <span>${userData.email}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Joined</span>
                    <span>${joinedDate}</span>
                </div>
            </div>
            <button class="logout-btn" id="logout">Log Out</button>
        `;

        // Handle Logout by destroying the cookie
        this.shadowRoot.getElementById('logout').addEventListener('click', () => {
            document.cookie = "vent_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            window.location.href = '/index.html';
        });
    }
}
customElements.define('user-card', UserCard);
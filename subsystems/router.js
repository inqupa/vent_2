// Phase 3.1: Custom Nav Component
class NavBar extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const currentPath = window.location.pathname;
        const links = [
            { name: "Home", href: "/index.html" },
            { name: "Vents | Problems", href: "/skeleton/problem_placeholder.html" },
            { name: "Login | Sign-up", href: "/skeleton/auth_placeholder.html" },
            { name: "Profile", href: "/skeleton/profile_placeholder.html" }
        ];

        this.innerHTML = `
            <nav style="background: #333; padding: 10px; display: flex; justify-content: center;">
                <div class="nav-links">
                    ${links.map(link => {
                        const isActive = currentPath.endsWith(link.href) ? 'class="active"' : '';
                        return `<a href="${link.href}" ${isActive} style="color: rgba(255, 255, 255, 0.6); text-decoration: none; margin: 0 15px; font-family: sans-serif; font-weight: bold; transition: color 0.3s ease;">${link.name}</a>`;
                    }).join('')}
                </div>
            </nav>
            <style>
                .nav-links a:hover, .nav-links a.active { color: white !important; text-decoration: underline !important; }
                .nav-links a.active { border-bottom: 2px solid white; padding-bottom: 2px; }
            </style>
        `;
        console.log("%c Web Component: <nav-bar> initialized", "color: #20c997; font-weight: bold;");
    }
}

// Register the custom element
customElements.define('nav-bar', NavBar);
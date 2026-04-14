// subsystems/logic/nav-bar.js
class NavBar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
        window.subscribeToState('ui', () => this.render());
        this.render();
    }
    render() {
        const template = document.getElementById('nav-bar-template');
        if (!template) return;
        const fragment = document.createDocumentFragment();
        const content = template.content.cloneNode(true);
        const navLinks = content.querySelector('.nav-links');

        const links = [
            { name: "Home", href: "/index.html" },
            { name: "Vents | Problems", href: "/skeleton/problem_placeholder.html" },
            { name: "Login", href: "/skeleton/auth_placeholder.html" },
            { name: "Profile", href: "/skeleton/profile_placeholder.html" }
        ];

        links.forEach(link => {
            const a = document.createElement('a');
            a.href = link.href;
            a.textContent = link.name;
            navLinks.appendChild(a);
        });

        fragment.appendChild(content);
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(fragment);
    }
}
customElements.define('nav-bar', NavBar);
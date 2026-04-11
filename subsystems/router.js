// Phase 2.3: Contextual Nav Highlights
function createNav() {
    const nav = document.createElement('nav');
    const currentPath = window.location.pathname;

    // Define links
    const links = [
        { name: "Home", href: "/index.html" },
        { name: "Vents | Problems", href: "/skeleton/problem_placeholder.html" },
        { name: "Login | Sign-up", href: "/skeleton/auth_placeholder.html" },
        { name: "Profile", href: "/skeleton/profile_placeholder.html" }
    ];

    // Generate HTML and apply 'active' class to the matching link
    nav.innerHTML = `
        <div class="nav-links">
            ${links.map(link => {
                const isActive = currentPath.endsWith(link.href) ? 'class="active"' : '';
                return `<a href="${link.href}" ${isActive}>${link.name}</a>`;
            }).join('')}
        </div>
    `;

    // Apply basic nav styles
    nav.style.background = "#333";
    nav.style.padding = "10px";
    nav.style.display = "flex";
    nav.style.justifyContent = "center";
    document.body.prepend(nav);

    // Add CSS for the active highlight
    const style = document.createElement('style');
    style.innerHTML = `
        .nav-links a {
            color: rgba(255, 255, 255, 0.6);
            text-decoration: none;
            margin: 0 15px;
            font-family: sans-serif;
            font-weight: bold;
            transition: color 0.3s ease;
        }
        .nav-links a:hover, .nav-links a.active {
            color: white;
            text-decoration: underline;
        }
        .nav-links a.active {
            border-bottom: 2px solid white;
            padding-bottom: 2px;
        }
    `;
    document.head.appendChild(style);
    
    console.log(`%c Nav Context: Highlighted ${currentPath}`, "color: #17a2b8;");
}

createNav();
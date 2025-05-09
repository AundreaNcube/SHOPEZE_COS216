document.addEventListener("DOMContentLoaded", function() {
    // Load saved theme from local storage
    const savedTheme = localStorage.getItem("theme") || "light";
    applyTheme(savedTheme);

    // Theme toggle buttons
    const themeButtons = document.querySelectorAll(".theme-toggle");
    themeButtons.forEach(button => {
        button.addEventListener("click", function() {
            const newTheme = this.dataset.theme;
            applyTheme(newTheme);
            localStorage.setItem("theme", newTheme);
        });
    });
});

function applyTheme(theme) {
    document.body.className = theme + "-theme";
    // Update active button state
    document.querySelectorAll(".theme-toggle").forEach(button => {
        button.classList.toggle("active", button.dataset.theme === theme);
    });
}
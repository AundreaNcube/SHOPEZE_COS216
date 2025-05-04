document.addEventListener('DOMContentLoaded', function () {
    const logoutLinks = document.querySelectorAll('a[href="logout.php"]');

    logoutLinks.forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault();

            if (!confirm("Are you sure you want to log out?")) {
                return;
            }

            const messageElement = document.createElement('div');
            messageElement.id = 'logout-message';
            messageElement.textContent = "Logging out...";
            messageElement.style.color = "green";
            messageElement.style.position = "fixed";
            messageElement.style.top = "50%";
            messageElement.style.left = "50%";
            messageElement.style.transform = "translate(-50%, -50%)";
            messageElement.style.background = "rgba(0, 0, 0, 0.8)";
            messageElement.style.padding = "20px";
            messageElement.style.borderRadius = "5px";
            document.body.appendChild(messageElement);

            fetch('logout.php', {
                method: 'GET'
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Logout failed');
                    }
                    return response.text();
                })
                .then(() => {
                    localStorage.removeItem("apikey");
                    setTimeout(() => {
                        window.location.href = 'login.php';
                    }, 1000); // Slightly reduced delay
                })
                .catch(error => {
                    console.error("Logout Error:", error);
                    messageElement.textContent = "Error logging out. Please try again.";
                    messageElement.style.color = "red";
                });
        });
    });
});
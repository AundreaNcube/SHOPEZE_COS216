document.addEventListener('DOMContentLoaded', function () {
    const logoutLinks = document.querySelectorAll('a[href="logout.php"]');

    logoutLinks.forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault(); // Prevent immediate navigation

            // Optional: Add confirmation
            if (!confirm("Are you sure you want to log out?")) {
                return;
            }

            // Optional: Show feedback
            const messageElement = document.createElement('div');
            messageElement.id = 'logout-message';
            messageElement.textContent = "Logging out...";
            messageElement.style.color = "green";
            messageElement.style.position = "fixed";
            messageElement.style.top = "50%";
            messageElement.style.left = "50%";
            messageElement.style.transform = "translate(-50%, -50%)";
            document.body.appendChild(messageElement);

            // Call logout.php via fetch
            fetch('logout.php', {
                method: 'GET' // Since logout.php doesn't need data, GET is fine
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Logout failed');
                }
                // Redirect after success
                setTimeout(() => {
                    window.location.href = 'login.php';
                }, 5000); // Delay for feedback visibility
            })
            .catch(error => {
                console.error("Logout Error:", error);
                messageElement.textContent = "Error logging out. Please try again.";
                messageElement.style.color = "red";
            });
        });
    });
});
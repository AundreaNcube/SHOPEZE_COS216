document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("login-form");
    const messageElement = document.getElementById("login-form-message");
    const emailError = document.getElementById("email-error");
    const passwordError = document.getElementById("password-error");

    if (!loginForm) {
        console.error("Login form not found");
        return;
    }

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        emailError.textContent = "";
        passwordError.textContent = "";
        messageElement.textContent = "";

        const email = sanitizeInput(document.getElementById("email").value.trim());
        const password = document.getElementById("password").value.trim(); // Password not sanitized to preserve special chars

        let isValid = true;
        if (!email) {
            emailError.textContent = "Email is required";
            isValid = false;
        } else if (!validateEmail(email)) {
            emailError.textContent = "Please enter a valid email address";
            isValid = false;
        }
        if (!password) {
            passwordError.textContent = "Password is required";
            isValid = false;
        }
        if (!isValid) return;

        const requestBody = {
            type: "Login",
            email: email,
            password: password
        };

        console.log("Sending Request Body");

        fetch("http://localhost/COS216_WHEATLEY/api.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        })
            .then(response => {
                console.log("API Response Status:", response.status);
                if (!response.ok) {
                    return response.json().then(errorData => {
                        console.log("API Error Response:", errorData);
                        throw new Error(errorData.message || `HTTP error code: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log("API Response Data:", data);
                if (data.status === "success") {
                    messageElement.style.color = "green";
                    messageElement.textContent = "Login successful! Setting session...";

                    localStorage.setItem("apikey", data.data.apikey);
                    fetch("set_session.php", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            apikey: data.data.apikey
                        })
                    })
                        .then(response => {
                            console.log("Set Session Response Status:", response.status);
                            if (!response.ok) {
                                return response.text().then(text => {
                                    console.error("Set Session Error Response:", text);
                                    throw new Error("Failed to set session");
                                });
                            }
                            return response.json();
                        })
                        .then(sessionData => {
                            console.log("Set Session Response Data:", sessionData);
                            if (sessionData.status === "success") {
                                messageElement.textContent = "Session set! Redirecting to home page...";
                                console.log("Redirecting to index.php");
                                setTimeout(() => {
                                    window.location.href = "index.php";
                                }, 1500); // Reduced delay
                            } else {
                                console.error("Session set failed:", sessionData);
                                messageElement.style.color = "red";
                                messageElement.textContent = "Session setup failed: " + sessionData.message;
                            }
                        })
                        .catch(error => {
                            console.error("Session Error:", error);
                            messageElement.style.color = "red";
                            messageElement.textContent = "Error setting session: " + error.message;
                        });
                } else {
                    messageElement.style.color = "red";
                    messageElement.textContent = data.message || "Login failed. Please check your credentials.";
                }
            })
            .catch(error => {
                console.log("Login Error:", error);
                messageElement.style.color = "red";
                messageElement.textContent = "Error: " + error.message;
            });
    });

    function validateEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }

    function sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }
});
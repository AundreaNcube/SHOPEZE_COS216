
document.addEventListener('DOMContentLoaded', function () {
    console.log("We are here in the signup.js");
    const form = document.getElementById('signup-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');
    const formMessage = document.getElementById('form-message');

    if (!form || !emailInput || !passwordInput || !emailError || !passwordError || !formMessage) {
        console.error("One or more form elements not found:", {
            form: !!form, emailInput: !!emailInput, passwordInput: !!passwordInput,
            emailError: !!emailError, passwordError: !!passwordError, formMessage: !!formMessage
        });
        return;
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function isValidPassword(password) {
        const minLength = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasDigit = /[0-9]/.test(password);
        const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        return minLength && hasUpperCase && hasLowerCase && hasDigit && hasSymbol;
    }

    function getPasswordErrorMessage(password) {
        let message = "Password must contain:";
        if (password.length < 8) message += "<br>- At least 8 characters";
        if (!/[A-Z]/.test(password)) message += "<br>- At least one uppercase letter";
        if (!/[a-z]/.test(password)) message += "<br>- At least one lowercase letter";
        if (!/[0-9]/.test(password)) message += "<br>- At least one number";
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) message += "<br>- At least one special character";
        return message;
    }

    emailInput.addEventListener('input', function () {
        if (!isValidEmail(emailInput.value) && emailInput.value.trim() !== '') {
            emailError.textContent = "Please enter a valid email address";
            emailInput.classList.add('invalid');
        } else {
            emailError.textContent = "";
            emailInput.classList.remove('invalid');
        }
    });

    passwordInput.addEventListener('input', function () {
        if (!isValidPassword(passwordInput.value) && passwordInput.value.trim() !== '') {
            passwordError.innerHTML = getPasswordErrorMessage(passwordInput.value);
            passwordInput.classList.add('invalid');
        } else {
            passwordError.textContent = "";
            passwordInput.classList.remove('invalid');
        }
    });

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const name = document.getElementById('name').value.trim();
        const surname = document.getElementById('surname').value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const type = document.getElementById('type').value;

        let userType;
        switch (type) {
            case 'customer': userType = 'Customer'; break;
            case 'courier': userType = 'Courier'; break;
            case 'inventory manager': userType = 'Inventory Manager'; break;
            default: userType = 'Customer';
        }

        let isValid = true;

        if (!name || !surname || !email || !password || !type) {
            formMessage.textContent = "All fields are required";
            formMessage.className = "error";
            isValid = false;
        }

        if (!isValidEmail(email)) {
            emailError.textContent = "Please enter a valid email address";
            emailInput.classList.add('invalid');
            isValid = false;
        }

        if (!isValidPassword(password)) {
            passwordError.innerHTML = getPasswordErrorMessage(password);
            passwordInput.classList.add('invalid');
            isValid = false;
        }

        if (!isValid) return;

        formMessage.textContent = "Processing...";
        formMessage.className = "";

        const requestData = {
            type: "Register",
            name: name,
            surname: surname,
            email: email,
            password: password,
            user_type: userType
        };

        console.log("Sending Request Body");
        // console.log("Sending data:", JSON.stringify(requestData));

        try {
            const apiResponse = await fetch('https://wheatley.cs.up.ac.za/u22747363/api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            console.log("Response Status:", apiResponse.status);
            if (!apiResponse.ok) {
                const errorData = await apiResponse.json();
                console.log("Error Response:", errorData);
                throw new Error(`HTTP error : ${apiResponse.status}`);
            }

            const data = await apiResponse.json();
            console.log("Response Data:", data);

            if (apiResponse.status === 200 && data.status === 'success') {
                formMessage.textContent = `Registration successful! Your API Key: ${data.data.apikey}. Redirecting to login in 30 seconds...`;
                formMessage.className = "success";
                form.reset();
                setTimeout(() => {
                    window.location.href = 'login.php';
                }, 30000);
            } else if (data.status === 'error' && data.data && data.data.error_code === 'EMAIL_EXISTS') {
                emailError.textContent = "This email is already registered.";
                emailInput.classList.add('invalid');
                formMessage.textContent = "Registration failed: Email already in use.";
                formMessage.className = "error";
            } else {
                formMessage.textContent = data.message || "Registration failed. Please try again.";
                formMessage.className = "error";
            }
        } catch (error) {
            console.log("Signup Error:", error);
            formMessage.textContent = "An error occurred while registering: " + error.message + " - email may already registered";
            formMessage.className = "error";
        }
    });
});
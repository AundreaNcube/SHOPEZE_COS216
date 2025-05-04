document.addEventListener('DOMContentLoaded', function () {
    // console.log("We are here in the signup.js");

    // --- Validation Functions ---
    function isValidName(name) {
        return /^[A-Za-z]+$/.test(name);
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

    // --- DOM Elements ---
    const form = document.getElementById('signup-form');
    const nameInput = document.getElementById('name');
    const surnameInput = document.getElementById('surname');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const typeInput = document.getElementById('type');

    const nameError = document.getElementById('name-error');
    const surnameError = document.getElementById('surname-error');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');
    const formMessage = document.getElementById('form-message');

    // --- Check if elements are found ---
    if (!form || !nameInput || !surnameInput || !emailInput || !passwordInput || !typeInput ||
        !nameError || !surnameError || !emailError || !passwordError || !formMessage) {
        console.error("One or more form elements not found");
        return;
    }

    // --- Input Live Validation ---
    nameInput.addEventListener('input', function () {
        if (!isValidName(nameInput.value) && nameInput.value.trim() !== '') {
            nameError.textContent = "Name must only contain letters.";
            nameInput.classList.add('invalid');
        } else {
            nameError.textContent = "";
            nameInput.classList.remove('invalid');
        }
    });

    surnameInput.addEventListener('input', function () {
        if (!isValidName(surnameInput.value) && surnameInput.value.trim() !== '') {
            surnameError.textContent = "Surname must only contain letters.";
            surnameInput.classList.add('invalid');
        } else {
            surnameError.textContent = "";
            surnameInput.classList.remove('invalid');
        }
    });

    emailInput.addEventListener('input', function () {
        if (!isValidEmail(emailInput.value) && emailInput.value.trim() !== '') {
            emailError.textContent = "Please enter a valid email address.";
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

    // --- Form Submit Handler ---
    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const name = nameInput.value.trim();
        const surname = surnameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const type = typeInput.value;

        let isValid = true;

        // Empty field check
        if (!name || !surname || !email || !password || !type) {
            formMessage.textContent = "All fields are required.";
            formMessage.className = "error";
            isValid = false;
        }

        if (!isValidName(name)) {
            nameError.textContent = "Name must only contain letters.";
            nameInput.classList.add('invalid');
            isValid = false;
        } else {
            nameError.textContent = "";
            nameInput.classList.remove('invalid');
        }

        if (!isValidName(surname)) {
            surnameError.textContent = "Surname must only contain letters.";
            surnameInput.classList.add('invalid');
            isValid = false;
        } else {
            surnameError.textContent = "";
            surnameInput.classList.remove('invalid');
        }

        if (!isValidEmail(email)) {
            emailError.textContent = "Please enter a valid email address.";
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

        const userTypeMap = {
            customer: "Customer",
            courier: "Courier",
            "inventory manager": "Inventory Manager"
        };

        const requestData = {
            type: "Register",
            name: name,
            surname: surname,
            email: email,
            password: password,
            user_type: userTypeMap[type] || "Customer"
        };

        try {
            const apiResponse = await fetch("http://localhost/COS216_WHEATLEY/api.php", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            console.log("Response Status:", apiResponse.status);

            const data = await apiResponse.json();
            console.log("Response Data:", data);

            if (apiResponse.ok && data.status === 'success') {
                formMessage.textContent = `Registration successful! Your API Key: ${data.data.apikey}. Redirecting to login in 30 seconds...`;
                formMessage.className = "success";
                form.reset();
                setTimeout(() => {
                    window.location.href = 'login.php';
                }, 30000);
            } else if (data.status === 'error' && data.data?.error_code === 'EMAIL_EXISTS') {
                emailError.textContent = "This email is already registered.";
                emailInput.classList.add('invalid');
                formMessage.textContent = "Registration failed: Email already in use.";
                formMessage.className = "error";
            } else {
                formMessage.textContent = data.message || "Registration failed. Please try again.";
                formMessage.className = "error";
            }

        } catch (error) {
            console.error("Signup Error:", error);
            formMessage.textContent = "An error occurred while registering: " + error.message;
            formMessage.className = "error";
        }
    });
});

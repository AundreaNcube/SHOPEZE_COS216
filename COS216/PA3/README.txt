# ShopEze - Online Shopping Platform

## How to Use the Website

    **Sign up**
    From the launch page navigate to the `signup.php` on the WHEATLEY website.
    Fill in the form with your name, surname, email, password, and account type (Customer, Courier, Inventory Manager).
    Submit the form to register. Upon success, you’ll receive an API key (stored in the database and displayed in the session message).

    **Login**:
   - Go to `login.php`
   - Enter your email and password.
   - On successful login, you’ll be redirected to `index.php` with an active session and API key.

## Default Login Details

    The following user is pre-registered in the database on `wheatley.cs.up.ac.za` for testing purposes:
    - **Name**: `Satoshi`
    - **Surname**: `Nakamoto`
    - **Email**: `satoshi.nakamoto@gmail.com`
    - **Password**: `Satoshi@00`
    - **Account Type**: `Customer`
    - **API Key**: `68443f974745617bd5fadbeba08b7a06`
    
## Functionality Not Implemented

    I Implemented the whole specification


## Explanations

### Password Requirements

    Passwords must meet the following criteria (enforced in `api.php`’s `validatePassword` method):
        - **Minimum Length**: 8 characters to ensure sufficient complexity.
        - **Uppercase Letter**: At least one (e.g., `[A-Z]`) for added strength.
        - **Lowercase Letter**: At least one (e.g., `[a-z]`) for variety.
        - **Digit**: At least one (e.g., `[0-9]`) to prevent purely alphabetic passwords.
        - **Special Character**: At least one (e.g., `[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]`) to increase lack of predictability for attack outside.

**Reason**: These requirements balance security and usability, protecting against brute-force attacks and common password patterns while remaining memorable for users.

### Choice of Hashing Algorithm
    The `hashPassword` method in `api.php` uses:
        - **Primary Algorithm**: `PASSWORD_ARGON2ID` .
        - **Fallback**: `PASSWORD_BCRYPT` (as a fallback method in the event PASSWORD_ARGON2ID fails)

    **Explanation**:
    - **Argon2id**: Preferred for its resistance to GPU-based attacks . It’s the modern standard for password hashing, offering a hybrid of side-channel resistance and its speed.
    - **Bcrypt**: Used as a fallback for compatibility with older systems. It’s widely trusted, with a work factor that slows down brute-force attempts.

The hashed password is stored in the `users` table, and `verifyPassword` supports both formats.

### Generation of API Keys
    API keys are generated in `generateApiKey`:
        - **Method**: `bin2hex(random_bytes(16))`
        - **Output**: A 32-character hexadecimal string (e.g., `4e9b2f8c1d7a5e3b9c0f6d2a8e4b1f7c`).

    **Explanation**:
        - **`random_bytes(16)`**: Generates 16 bytes (128 bits) of cryptographically secure random data . This ensures high entropy, making keys unpredictable.
        - **`bin2hex`**: Converts the binary data to a readable hexadecimal string, doubling the length to 32 characters for simplicity and compatibility with API requests.
        - **Purpose**: The API key authenticates users for product requests (e.g., `GetAllProducts`), stored in the `users` table and validated via `api_key` lookup. Its randomness prevents guessing or collisions.
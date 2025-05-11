<?php
// api.php
require_once __DIR__ . '/COS216/PA4/php/config.php';

if (!defined('PASSWORD_ARGON2ID')) {
    define('MY_PASSWORD_ALGO', PASSWORD_BCRYPT);
} else {
    define('MY_PASSWORD_ALGO', PASSWORD_ARGON2ID);
}

class API
{
    private static $instance = null;
    private $db;
    private $requestData;
    private $response = [];

    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct()
    {
        global $db;
        $this->db = $db;
        $this->requestData = $this->getRequestData();
        $this->response = [
            'status' => 'error',
            'timestamp' => time() * 1000,
            'data' => []
        ];
    }

    private function getRequestData()
    {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->respondWithError('Invalid JSON data', 400);
            exit;
        }
        return $data ?: [];
    }

    public function processRequest()
    {
        if (!isset($this->requestData['type'])) {
            $this->respondWithError('Missing request type', 400);
            return;
        }

        switch ($this->requestData['type']) {
            case 'Register':
                $this->handleRegistration();
                break;
            case 'Login':
                $this->handleLogin();
                break;
            case 'GetAllProducts':
                $this->handleGetAllProducts();
                break;
            case 'Wishlist':
                $this->handleWishlist();
                break;
            case 'Cart':
                $this->handleCart();
                break;
            case 'Order':
                $this->handleOrder();
                break;
            case 'Preferences':
                $this->handlePreferences();
                break;
            default:
                $this->respondWithError('Invalid request type', 400);
                break;
        }
    }

    private function handleRegistration()
    {
        $requiredFields = ['name', 'surname', 'email', 'password', 'user_type'];
        foreach ($requiredFields as $field) {
            if (!isset($this->requestData[$field]) || trim($this->requestData[$field]) === '') {
                $this->respondWithError("Missing or empty field: $field", 400);
                return;
            }
        }

        $name = trim($this->requestData['name']);
        $surname = trim($this->requestData['surname']);
        $email = trim($this->requestData['email']);
        $password = $this->requestData['password'];
        $userType = trim($this->requestData['user_type']);

        if (!$this->validateEmail($email)) {
            $this->respondWithError("Invalid email format", 400);
            return;
        }

        $passwordValidation = $this->validatePassword($password);
        if ($passwordValidation !== true) {
            $this->respondWithError("Password does not meet requirements: $passwordValidation", 400);
            return;
        }

        $validUserTypes = ['customer', 'courier', 'inventory manager'];
        if (!in_array(strtolower($userType), $validUserTypes)) {
            $this->respondWithError("Invalid user type", 400);
            return;
        }
        $userType = ucfirst(strtolower($userType));
        if (strtolower($userType) === 'inventory manager') {
            $userType = 'Inventory Manager';
        }

        $conn = $this->db->getConn();
        $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $this->response['data'] = ['error_code' => 'EMAIL_EXISTS'];
            $this->respondWithError("Email already exists", 409);
            return;
        }

        $apiKey = $this->generateApiKey();
        $hashedPassword = $this->hashPassword($password);

        $stmt = $conn->prepare("INSERT INTO users (name, surname, email, password, type, api_key) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssss", $name, $surname, $email, $hashedPassword, $userType, $apiKey);

        if ($stmt->execute()) {
            $this->response['status'] = 'success';
            $this->response['data'] = ['apikey' => $apiKey];
            $this->sendResponse(200);
        } else {
            $this->respondWithError("Database error: " . $stmt->error, 500);
        }
    }

    private function handleLogin()
    {
        $requiredFields = ['email', 'password'];
        foreach ($requiredFields as $field) {
            if (!isset($this->requestData[$field]) || trim($this->requestData[$field]) === '') {
                $this->respondWithError("Missing or empty field: $field", 400);
                return;
            }
        }

        $email = trim($this->requestData['email']);
        $password = $this->requestData['password'];

        $conn = $this->db->getConn();
        $stmt = $conn->prepare("SELECT id, password, api_key FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            $this->respondWithError("Invalid email or password", 401);
            return;
        }

        $user = $result->fetch_assoc();
        if ($this->verifyPassword($password, $user['password'])) {
            $this->response['status'] = 'success';
            $this->response['data'] = [
                'apikey' => $user['api_key']
            ];
            $this->sendResponse(200);
        } else {
            $this->respondWithError("Invalid email or password", 401);
        }
    }

    private function handleGetAllProducts()
    {
        $requiredFields = ['apikey', 'return'];
        foreach ($requiredFields as $field) {
            if (!isset($this->requestData[$field])) {
                $this->respondWithError("Missing required field: $field", 400);
                return;
            }
        }

        $apikey = $this->requestData['apikey'];
        $returnFields = $this->requestData['return'];
        $limit = isset($this->requestData['limit']) ? (int)$this->requestData['limit'] : 500;
        $sort = isset($this->requestData['sort']) ? $this->requestData['sort'] : null;
        $order = isset($this->requestData['order']) ? strtoupper($this->requestData['order']) : 'ASC';
        $fuzzy = isset($this->requestData['fuzzy']) ? filter_var($this->requestData['fuzzy'], FILTER_VALIDATE_BOOLEAN) : true;
        $search = isset($this->requestData['search']) && is_array($this->requestData['search']) ? $this->requestData['search'] : [];

        $conn = $this->db->getConn();
        $stmt = $conn->prepare("SELECT id FROM users WHERE api_key = ?");
        $stmt->bind_param("s", $apikey);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows === 0) {
            $this->respondWithError("Invalid API key", 401);
            return;
        }

        if ($limit < 1 || $limit > 500) {
            $this->respondWithError("Limit must be between 1 and 500", 400);
            return;
        }

        $validFields = [
            'id',
            'title',
            'brand',
            'description',
            'initial_price',
            'final_price',
            'categories',
            'image_url',
            'product_dimensions',
            'date_first_available',
            'manufacturer',
            'department',
            'features',
            'is_available',
            'images',
            'country_of_origin'
        ];
        $validSearchFields = [
            'id',
            'title',
            'brand',
            'categories',
            'department',
            'manufacturer',
            'features',
            'pricemin',
            'pricemax',
            'country_of_origin'
        ];

        if ($returnFields === '*') {
            $selectFields = $validFields;
        } else {
            if (!is_array($returnFields)) {
                $this->respondWithError("Return must be an array or '*'", 400);
                return;
            }
            $selectFields = array_intersect($returnFields, $validFields);
            if (empty($selectFields)) {
                $this->respondWithError("No valid return fields specified", 400);
                return;
            }
        }

        if ($sort && !in_array($sort, $validFields)) {
            $this->respondWithError("Invalid sort field", 400);
            return;
        }
        if ($sort && !in_array($order, ['ASC', 'DESC'])) {
            $this->respondWithError("Order must be 'ASC' or 'DESC'", 400);
            return;
        }

        $quotedFields = array_map(function ($f) {
            return "`$f`";
        }, $selectFields);
        $query = "SELECT " . implode(', ', $quotedFields) . " FROM products";
        $whereClauses = [];
        $params = [];
        $types = "";

        foreach ($search as $key => $value) {
            if (!in_array($key, $validSearchFields)) {
                $this->respondWithError("Invalid search field: $key", 400);
                return;
            }
            if ($key === 'pricemin' || $key === 'pricemax') {
                $column = 'final_price';
                $operator = $key === 'pricemin' ? '>=' : '<=';
                $whereClauses[] = "`$column` $operator ?";
                $params[] = (float)$value;
                $types .= 'd';
            } else {
                $values = array_filter(array_map('trim', explode(',', $value)));
                if (count($values) > 1) {
                    if ($fuzzy) {
                        $subClauses = array_fill(0, count($values), "`$key` LIKE ?");
                        $whereClauses[] = '(' . implode(' OR ', $subClauses) . ')';
                        foreach ($values as $val) {
                            $params[] = "%$val%";
                            $types .= 's';
                        }
                    } else {
                        $placeholders = str_repeat('?,', count($values) - 1) . '?';
                        $whereClauses[] = "`$key` IN ($placeholders)";
                        foreach ($values as $val) {
                            $params[] = $val;
                        }
                        $types .= str_repeat('s', count($values));
                    }
                } else {
                    $whereClauses[] = $fuzzy ? "`$key` LIKE ?" : "`$key` = ?";
                    $params[] = $fuzzy ? "%$value%" : $value;
                    $types .= 's';
                }
            }
        }

        if (!empty($whereClauses)) {
            $query .= " WHERE " . implode(' AND ', $whereClauses);
        }

        if ($sort) {
            $query .= " ORDER BY `$sort` $order";
        }

        $query .= " LIMIT ?";
        $params[] = $limit;
        $types .= 'i';

        error_log("Query: $query");
        error_log("Params: " . json_encode($params));
        error_log("Types: $types");

        $stmt = $conn->prepare($query);
        if ($stmt === false) {
            error_log("Prepare failed: " . $conn->error);
            $this->respondWithError("Query preparation failed: " . $conn->error, 500);
            return;
        }

        if ($types) {
            $bindParams = array($types);
            foreach ($params as $key => $value) {
                $bindParams[] = &$params[$key];
            }
            call_user_func_array(array($stmt, 'bind_param'), $bindParams);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $products = $result->fetch_all(MYSQLI_ASSOC);

        error_log("Products fetched: " . count($products));
        error_log("Sample products: " . json_encode(array_slice($products, 0, 5)));

        $exchangeRates = $this->getExchangeRates();
        if ($exchangeRates === false) {
            $this->respondWithError("Failed to fetch exchange rates", 503);
            return;
        }

        foreach ($products as &$product) {
            if (isset($product['initial_price']) && isset($product['currency'])) {
                $product['initial_price'] = $this->convertToZAR($product['initial_price'], $product['currency'], $exchangeRates);
            }
            if (isset($product['final_price']) && isset($product['currency'])) {
                $product['final_price'] = $this->convertToZAR($product['final_price'], $product['currency'], $exchangeRates);
                unset($product['currency']);
            }
        }
        unset($product);

        error_log("Sample converted products: " . json_encode(array_slice($products, 0, 5)));

        $this->response['status'] = 'success';
        $this->response['data'] = $products;
        $this->sendResponse(200);
    }

    private function getExchangeRates()
    {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://wheatley.cs.up.ac.za/api/');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        $postData = json_encode([
            'studentnum' => 'u22747363',
            'apikey' => 'ae575ccbd3973ae1ac92ea4ec40f8b43',
            'type' => 'GetCurrencyList'
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);

        $response = curl_exec($ch);
        if (curl_errno($ch)) {
            error_log("cURL Error: " . curl_error($ch));
            curl_close($ch);
            return [
                'USD' => 1,
                'ZAR' => 18.4380836589,
                'CNY' => 7.3026009457
            ];
        }
        curl_close($ch);

        $data = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE || !isset($data['status']) || $data['status'] !== 'success') {
            error_log("Invalid GetCurrencyList response: " . $response);
            return [
                'USD' => 1,
                'ZAR' => 18.4380836589,
                'CNY' => 7.3026009457
            ];
        }
        return $data['data'];
    }

    private function convertToZAR($price, $currency, $rates)
    {
        if (!isset($rates[$currency]) || !isset($rates['ZAR'])) {
            return $price;
        }
        $usdPrice = $price / $rates[$currency];
        return round($usdPrice * $rates['ZAR'], 2);
    }

    private function validateEmail($email)
    {
        $simplePattern = '/^[^\s@]+@[^\s@]+\.[^\s@]+$/';
        return preg_match($simplePattern, $email);
    }

    private function validatePassword($password)
    {
        if (strlen($password) < 8) return "Password must be at least 8 characters long";
        if (!preg_match('/[A-Z]/', $password)) return "Password must contain at least one uppercase letter";
        if (!preg_match('/[a-z]/', $password)) return "Password must contain at least one lowercase letter";
        if (!preg_match('/[0-9]/', $password)) return "Password must contain at least one digit";
        if (!preg_match('/[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]/', $password)) return "Password must contain at least one special character";
        return true;
    }

    private function generateApiKey()
    {
        return bin2hex(random_bytes(16));
    }

    private function hashPassword($password)
    {
        return password_hash($password, MY_PASSWORD_ALGO);
    }

    private function verifyPassword($password, $storedHash)
    {
        if (strpos($storedHash, ':') !== false) {
            list($hash, $salt) = explode(':', $storedHash, 2);
            $pswSalt = $password . $salt;
            $computedHash = hash('sha256', $pswSalt);
            return $computedHash === $hash;
        }
        return password_verify($password, $storedHash);
    }

    private function respondWithError($message, $httpCode)
    {
        $this->response['status'] = 'error';
        $this->response['message'] = $message;
        $this->sendResponse($httpCode);
    }

    private function sendResponse($httpCode)
    {
        http_response_code($httpCode);
        header('Content-Type: application/json');
        echo json_encode($this->response);
        exit;
    }

    private function handleWishlist()
    {
        if (!isset($this->requestData['apikey']) || empty($this->requestData['apikey'])) {
            $this->respondWithError("API key is required", 400);
            return;
        }

        $apikey = $this->requestData['apikey'];

        $conn = $this->db->getConn();
        $stmt = $conn->prepare("SELECT id FROM users WHERE api_key = ?");
        $stmt->bind_param("s", $apikey);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            $this->respondWithError("Invalid API key", 401);
            return;
        }

        $user = $result->fetch_assoc();
        $userId = $user['id'];

        if (!isset($this->requestData['action']) || empty($this->requestData['action'])) {
            $this->respondWithError("Action is required", 400);
            return;
        }

        $action = $this->requestData['action'];

        switch ($action) {
            case 'add':
                $this->addToWishlist($userId);
                break;
            case 'remove':
                $this->removeFromWishlist($userId);
                break;
            case 'get':
                $this->getWishlist($userId);
                break;
            default:
                $this->respondWithError("Invalid action", 400);
                break;
        }
    }

    private function addToWishlist($userId)
    {
        if (!isset($this->requestData['product_id']) || empty($this->requestData['product_id'])) {
            $this->respondWithError("Product ID is required", 400);
            return;
        }

        $productId = $this->requestData['product_id'];

        $conn = $this->db->getConn();
        $stmt = $conn->prepare("SELECT id FROM products WHERE id = ?");
        $stmt->bind_param("s", $productId);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            $this->respondWithError("Product not found", 404);
            return;
        }

        $stmt = $conn->prepare("SELECT id FROM wishlists WHERE customer_id = ? AND product_id = ?");
        $stmt->bind_param("ss", $userId, $productId);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $this->response['status'] = 'success';
            $this->response['data'] = ['message' => 'Product is already in the wishlist'];
            $this->sendResponse(200);
            return;
        }

        $stmt = $conn->prepare("INSERT INTO wishlists (customer_id, product_id, createdAt) VALUES (?, ?, NOW())");
        $stmt->bind_param("ss", $userId, $productId);

        if ($stmt->execute()) {
            $this->response['status'] = 'success';
            $this->response['data'] = ['message' => 'Product added to wishlist successfully'];
            $this->sendResponse(200);
        } else {
            $this->respondWithError("Failed to add product to wishlist: " . $stmt->error, 500);
        }
    }

    private function removeFromWishlist($userId)
    {
        if (!isset($this->requestData['product_id']) || empty($this->requestData['product_id'])) {
            $this->respondWithError("Product ID is required", 400);
            return;
        }

        $productId = $this->requestData['product_id'];

        $conn = $this->db->getConn();
        $stmt = $conn->prepare("DELETE FROM wishlists WHERE customer_id = ? AND product_id = ?");
        $stmt->bind_param("ss", $userId, $productId);

        if ($stmt->execute()) {
            $this->response['status'] = 'success';
            $this->response['data'] = ['message' => 'Product removed from wishlist successfully'];
            $this->sendResponse(200);
        } else {
            $this->respondWithError("Failed to remove product from wishlist: " . $stmt->error, 500);
        }
    }

    private function getWishlist($userId)
    {
        $conn = $this->db->getConn();
        $query = "SELECT p.id, p.title, p.brand, p.image_url, p.final_price, 'ZAR' as currency, p.department 
                  FROM wishlists w 
                  JOIN products p ON w.product_id = p.id 
                  WHERE w.customer_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("s", $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        $products = [];
        while ($row = $result->fetch_assoc()) {
            $products[] = $row;
        }

        $this->response['status'] = 'success';
        $this->response['data'] = $products;
        $this->sendResponse(200);
    }

    private function handleCart()
    {
        if (!isset($this->requestData['apikey']) || empty($this->requestData['apikey'])) {
            $this->respondWithError("API key is required", 400);
            return;
        }

        $apikey = $this->requestData['apikey'];

        $conn = $this->db->getConn();
        $stmt = $conn->prepare("SELECT id FROM users WHERE api_key = ?");
        $stmt->bind_param("s", $apikey);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            $this->respondWithError("Invalid API key", 401);
            return;
        }

        $user = $result->fetch_assoc();
        $userId = $user['id'];

        if (!isset($this->requestData['action']) || empty($this->requestData['action'])) {
            $this->respondWithError("Action is required", 400);
            return;
        }

        $action = $this->requestData['action'];

        switch ($action) {
            case 'add':
                $this->addToCart($userId);
                break;
            case 'remove':
                $this->removeFromCart($userId);
                break;
            case 'get':
                $this->getCart($userId);
                break;
            case 'update':
                $this->updateCart($userId);
                break;
            default:
                $this->respondWithError("Invalid action", 400);
                break;
        }
    }

    private function addToCart($userId)
    {
        if (!isset($this->requestData['product_id']) || empty($this->requestData['product_id'])) {
            $this->respondWithError("Product ID is required", 400);
            return;
        }
        if (!isset($this->requestData['quantity']) || !is_numeric($this->requestData['quantity']) || $this->requestData['quantity'] < 1) {
            $this->respondWithError("Valid quantity is required", 400);
            return;
        }

        $productId = $this->requestData['product_id'];
        $quantity = (int)$this->requestData['quantity'];

        $conn = $this->db->getConn();
        $stmt = $conn->prepare("SELECT id FROM products WHERE id = ?");
        $stmt->bind_param("s", $productId);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            $this->respondWithError("Product not found", 404);
            return;
        }

        $stmt = $conn->prepare("SELECT temp_id, quantity FROM u22747363_carts WHERE customer_id = ? AND product_id = ?");
        $stmt->bind_param("ss", $userId, $productId);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $cartItem = $result->fetch_assoc();
            $newQuantity = $cartItem['quantity'] + $quantity;
            $stmt = $conn->prepare("UPDATE u22747363_carts SET quantity = ?, createdAt = NOW() WHERE temp_id = ?");
            $stmt->bind_param("ii", $newQuantity, $cartItem['temp_id']);
        } else {
            $stmt = $conn->prepare("INSERT INTO u22747363_carts (customer_id, product_id, createdAt, quantity) VALUES (?, ?, NOW(), ?)");
            $stmt->bind_param("ssi", $userId, $productId, $quantity);
        }

        if ($stmt->execute()) {
            $this->response['status'] = 'success';
            $this->response['data'] = ['message' => 'Product added to cart successfully'];
            $this->sendResponse(200);
        } else {
            $this->respondWithError("Failed to add product to cart: " . $stmt->error, 500);
        }
    }

    private function removeFromCart($userId)
    {
        if (!isset($this->requestData['product_id']) || empty($this->requestData['product_id'])) {
            $this->respondWithError("Product ID is required", 400);
            return;
        }

        $productId = $this->requestData['product_id'];

        $conn = $this->db->getConn();
        $stmt = $conn->prepare("DELETE FROM u22747363_carts WHERE customer_id = ? AND product_id = ?");
        $stmt->bind_param("ss", $userId, $productId);

        if ($stmt->execute()) {
            $this->response['status'] = 'success';
            $this->response['data'] = ['message' => 'Product removed from cart successfully'];
            $this->sendResponse(200);
        } else {
            $this->respondWithError("Failed to remove product from cart: " . $stmt->error, 500);
        }
    }

    private function updateCart($userId)
    {
        if (!isset($this->requestData['product_id']) || empty($this->requestData['product_id'])) {
            $this->respondWithError("Product ID is required", 400);
            return;
        }
        if (!isset($this->requestData['quantity']) || !is_numeric($this->requestData['quantity']) || $this->requestData['quantity'] < 1) {
            $this->respondWithError("Valid quantity is required", 400);
            return;
        }

        $productId = $this->requestData['product_id'];
        $quantity = (int)$this->requestData['quantity'];

        $conn = $this->db->getConn();
        $stmt = $conn->prepare("SELECT temp_id FROM u22747363_carts WHERE customer_id = ? AND product_id = ?");
        $stmt->bind_param("ss", $userId, $productId);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            $this->respondWithError("Product not found in cart", 404);
            return;
        }

        $stmt = $conn->prepare("UPDATE u22747363_carts SET quantity = ?, createdAt = NOW() WHERE customer_id = ? AND product_id = ?");
        $stmt->bind_param("iss", $quantity, $userId, $productId);

        if ($stmt->execute()) {
            $this->response['status'] = 'success';
            $this->response['data'] = ['message' => 'Cart updated successfully'];
            $this->sendResponse(200);
        } else {
            $this->respondWithError("Failed to update cart: " . $stmt->error, 500);
        }
    }

    private function getCart($userId)
    {
        $conn = $this->db->getConn();
        $query = "SELECT p.id, p.title, p.brand, p.image_url, p.final_price, 'ZAR' as currency, c.quantity 
                  FROM u22747363_carts c 
                  JOIN products p ON c.product_id = p.id 
                  WHERE c.customer_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("s", $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        $cartItems = [];
        while ($row = $result->fetch_assoc()) {
            $cartItems[] = $row;
        }

        $this->response['status'] = 'success';
        $this->response['data'] = $cartItems;
        $this->sendResponse(200);
    }

    private function handleOrder()
    {
        if (!isset($this->requestData['apikey']) || empty($this->requestData['apikey'])) {
            $this->respondWithError("API key is required", 400);
            return;
        }

        $apikey = $this->requestData['apikey'];

        $conn = $this->db->getConn();
        $stmt = $conn->prepare("SELECT id FROM users WHERE api_key = ?");
        $stmt->bind_param("s", $apikey);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            $this->respondWithError("Invalid API key", 401);
            return;
        }

        $user = $result->fetch_assoc();
        $userId = $user['id'];

        if (!isset($this->requestData['action']) || empty($this->requestData['action'])) {
            $this->respondWithError("Action is required", 400);
            return;
        }

        $action = $this->requestData['action'];

        switch ($action) {
            case 'create':
                $this->createOrder($userId);
                break;
            case 'get':
                $this->getOrders($userId);
                break;
            default:
                $this->respondWithError("Invalid action", 400);
                break;
        }
    }

    private function createOrder($userId)
    {
        $conn = $this->db->getConn();
        $conn->begin_transaction();

        try {
            // Get cart items
            $stmt = $conn->prepare("SELECT product_id, quantity FROM u22747363_carts WHERE customer_id = ?");
            $stmt->bind_param("s", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            $cartItems = $result->fetch_all(MYSQLI_ASSOC);

            if (empty($cartItems)) {
                $conn->rollback();
                $this->respondWithError("Cart is empty", 400);
                return;
            }

            // Validate products
            foreach ($cartItems as $item) {
                $stmt = $conn->prepare("SELECT id FROM products WHERE id = ?");
                $stmt->bind_param("s", $item['product_id']);
                $stmt->execute();
                $result = $stmt->get_result();
                if ($result->num_rows === 0) {
                    $conn->rollback();
                    $this->respondWithError("Product not found: " . $item['product_id'], 404);
                    return;
                }
            }

            // Generate random delivery date between May 19 and May 25, 2025
            $deliveryDate = '2025-05-' . rand(19, 25);

            // Create order
            $stmt = $conn->prepare("INSERT INTO u22747363_orders (customer_id, state, delivery_date, createdAt) VALUES (?, 'Storage', ?, NOW())");
            $stmt->bind_param("ss", $userId, $deliveryDate);
            $stmt->execute();
            $orderId = $conn->insert_id;

            // Insert cart items into order_products
            $stmt = $conn->prepare("INSERT INTO u22747363_order_products (order_id, product_id, quantity) VALUES (?, ?, ?)");
            foreach ($cartItems as $item) {
                $stmt->bind_param("iss", $orderId, $item['product_id'], $item['quantity']);
                $stmt->execute();
            }

            // Clear cart
            $stmt = $conn->prepare("DELETE FROM u22747363_carts WHERE customer_id = ?");
            $stmt->bind_param("s", $userId);
            $stmt->execute();

            $conn->commit();

            $this->response['status'] = 'success';
            $this->response['data'] = ['order_id' => $orderId, 'message' => 'Order created successfully'];
            $this->sendResponse(200);
        } catch (Exception $e) {
            $conn->rollback();
            $this->respondWithError("Failed to create order: " . $e->getMessage(), 500);
        }
    }

    private function getOrders($userId)
    {
        $conn = $this->db->getConn();
        $query = "SELECT o.order_id, o.state, o.delivery_date, o.createdAt, 
                         op.product_id, op.quantity, 
                         p.title, p.brand, p.image_url, p.final_price, 'ZAR' as currency
                  FROM u22747363_orders o
                  LEFT JOIN u22747363_order_products op ON o.order_id = op.order_id
                  LEFT JOIN products p ON op.product_id = p.id
                  WHERE o.customer_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("s", $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        $orders = [];
        while ($row = $result->fetch_assoc()) {
            $orderId = $row['order_id'];
            if (!isset($orders[$orderId])) {
                $orders[$orderId] = [
                    'order_id' => $orderId,
                    'state' => $row['state'],
                    'delivery_date' => $row['delivery_date'],
                    'createdAt' => $row['createdAt'],
                    'products' => []
                ];
            }
            if ($row['product_id']) {
                $orders[$orderId]['products'][] = [
                    'product_id' => $row['product_id'],
                    'title' => $row['title'],
                    'brand' => $row['brand'],
                    'image_url' => $row['image_url'],
                    'final_price' => $row['final_price'],
                    'currency' => $row['currency'],
                    'quantity' => $row['quantity']
                ];
            }
        }

        $this->response['status'] = 'success';
        $this->response['data'] = array_values($orders);
        $this->sendResponse(200);
    }

    private function handlePreferences()
    {
        if (!isset($this->requestData['apikey']) || empty($this->requestData['apikey'])) {
            $this->respondWithError("API key is required", 400);
            return;
        }

        $apikey = $this->requestData['apikey'];

        $conn = $this->db->getConn();
        $stmt = $conn->prepare("SELECT id FROM users WHERE api_key = ?");
        $stmt->bind_param("s", $apikey);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            $this->respondWithError("Invalid API key", 401);
            return;
        }

        if (!isset($this->requestData['action']) || empty($this->requestData['action'])) {
            $this->respondWithError("Action is required", 400);
            return;
        }

        $action = $this->requestData['action'];

        switch ($action) {
            case 'save':
                $this->savePreferences($apikey);
                break;
            case 'get':
                $this->getPreferences($apikey);
                break;
            case 'reset':
                $this->resetPreferences($apikey);
                break;
            default:
                $this->respondWithError("Invalid action", 400);
                break;
        }
    }

    private function savePreferences($apikey)
    {
        $conn = $this->db->getConn();

        // Validate preferences
        $department = isset($this->requestData['department']) ? trim($this->requestData['department']) : null;
        $brand = isset($this->requestData['brand']) ? trim($this->requestData['brand']) : null;
        $country_of_origin = isset($this->requestData['country_of_origin']) ? trim($this->requestData['country_of_origin']) : null;
        $pricemax = isset($this->requestData['pricemax']) && is_numeric($this->requestData['pricemax']) ? (float)$this->requestData['pricemax'] : null;
        $currency = isset($this->requestData['currency']) ? trim($this->requestData['currency']) : null;

        // Validate currency (must be 3 characters, e.g., ZAR, USD, CNY)
        if ($currency && !preg_match('/^[A-Z]{3}$/', $currency)) {
            error_log("Invalid currency code received for API key $apikey: $currency");
            $this->respondWithError("Invalid currency code", 400);
            return;
        }

        // Log the preferences being saved
        error_log("Saving preferences for API key: $apikey, department: " . ($department ?: 'null') .
            ", brand: " . ($brand ?: 'null') .
            ", country_of_origin: " . ($country_of_origin ?: 'null') .
            ", pricemax: " . ($pricemax !== null ? $pricemax : 'null') .
            ", currency: " . ($currency ?: 'null'));

        // Check if preferences exist for the user
        $stmt = $conn->prepare("SELECT id FROM u22747363_preferences WHERE api_key = ?");
        if ($stmt === false) {
            error_log("Prepare failed for SELECT: " . $conn->error);
            $this->respondWithError("Database error: " . $conn->error, 500);
            return;
        }
        $stmt->bind_param("s", $apikey);
        if (!$stmt->execute()) {
            error_log("Execute failed for SELECT: " . $stmt->error);
            $this->respondWithError("Database error: " . $stmt->error, 500);
            return;
        }
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            // Update existing preferences
            $stmt = $conn->prepare("UPDATE u22747363_preferences SET department = ?, brand = ?, country_of_origin = ?, pricemax = ?, currency = ? WHERE api_key = ?");
            if ($stmt === false) {
                error_log("Prepare failed for UPDATE: " . $conn->error);
                $this->respondWithError("Database error: " . $conn->error, 500);
                return;
            }
            // Fixed: Correct type string to "ssssds" to match 6 parameters
            $stmt->bind_param("ssssds", $department, $brand, $country_of_origin, $pricemax, $currency, $apikey);
        } else {
            // Insert new preferences
            $stmt = $conn->prepare("INSERT INTO u22747363_preferences (api_key, department, brand, country_of_origin, pricemax, currency) VALUES (?, ?, ?, ?, ?, ?)");
            if ($stmt === false) {
                error_log("Prepare failed for INSERT: " . $conn->error);
                $this->respondWithError("Database error: " . $conn->error, 500);
                return;
            }
            $stmt->bind_param("ssssds", $apikey, $department, $brand, $country_of_origin, $pricemax, $currency);
        }

        if ($stmt->execute()) {
            error_log("Preferences saved successfully for API key: $apikey");
            $this->response['status'] = 'success';
            $this->response['data'] = ['message' => 'Preferences saved successfully'];
            $this->sendResponse(200);
        } else {
            error_log("Failed to save preferences for API key $apikey: " . $stmt->error);
            $this->respondWithError("Failed to save preferences: " . $stmt->error, 500);
        }
    }

    private function resetPreferences($apikey)
    {
        $conn = $this->db->getConn();

        // Check if a row exists for the API key
        $stmt = $conn->prepare("SELECT id FROM u22747363_preferences WHERE api_key = ?");
        $stmt->bind_param("s", $apikey);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            // Update existing preferences to default values
            $stmt = $conn->prepare("UPDATE u22747363_preferences SET department = NULL, brand = NULL, country_of_origin = NULL, pricemax = NULL, currency = 'ZAR' WHERE api_key = ?");
            $stmt->bind_param("s", $apikey);
        } else {
            // Insert a new row with default values if none exists
            $stmt = $conn->prepare("INSERT INTO u22747363_preferences (api_key, department, brand, country_of_origin, pricemax, currency) VALUES (?, NULL, NULL, NULL, NULL, 'ZAR')");
            $stmt->bind_param("s", $apikey);
        }

        if ($stmt->execute()) {
            error_log("Preferences reset successfully for API key: $apikey");
            $this->response['status'] = 'success';
            $this->response['data'] = ['message' => 'Preferences reset successfully'];
            $this->sendResponse(200);
        } else {
            error_log("Failed to reset preferences for API key $apikey: " . $stmt->error);
            $this->respondWithError("Failed to reset preferences: " . $stmt->error, 500);
        }
    }
    
    private function getPreferences($apikey)
    {
        $conn = $this->db->getConn();
        $stmt = $conn->prepare("SELECT department, brand, country_of_origin, pricemax, currency FROM u22747363_preferences WHERE api_key = ?");
        $stmt->bind_param("s", $apikey);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            $this->response['status'] = 'success';
            $this->response['data'] = [];
            $this->sendResponse(200);
            return;
        }

        $preferences = $result->fetch_assoc();
        $this->response['status'] = 'success';
        $this->response['data'] = $preferences;
        $this->sendResponse(200);
    }
}

if (basename($_SERVER['SCRIPT_FILENAME']) == basename(__FILE__)) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode([
            'status' => 'error',
            'timestamp' => time() * 1000,
            'message' => 'Method not allowed. Use POST.'
        ]);
        exit;
    }
    $api = API::getInstance();
    $api->processRequest();
}

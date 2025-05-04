<?php

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
            // 'message' => 'Unknown error occurred',
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
        return $data ?: []; // Return empty array if null
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
            // $this->response['message'] = 'Registration successful';
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

        // Replaced arrow function with traditional anonymous function
        $quotedFields = array_map(function($f) { return "`$f`"; }, $selectFields);
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
                        // Merge arrays manually since array spread is not available in PHP 7.3
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
            // Need to use call_user_func_array instead of argument unpacking
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
        // $this->response['message'] = 'Products retrieved successfully';
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
            'studentnum' => 'u22747363', // Your student number from old products.js
            'apikey' => 'ae575ccbd3973ae1ac92ea4ec40f8b43', // Your API key from old products.js
            'type' => 'GetCurrencyList'
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);

        $response = curl_exec($ch);
        if (curl_errno($ch)) {
            error_log("cURL Error: " . curl_error($ch));
            curl_close($ch);
            // Fallback to mock data if Wheatley API fails.. just for,  remove 
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
            // Fallback to mock data
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
}

// Entry point
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
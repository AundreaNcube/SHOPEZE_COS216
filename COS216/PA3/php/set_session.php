<?php
session_start();

ob_start(); 

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (isset($data['user_id']) && isset($data['apikey'])) {
        try {
            require_once 'config.php';
            $conn = $db->getConn();

            $stmt = $conn->prepare("SELECT name FROM users WHERE id = ?");
            $stmt->bind_param("i", $data['user_id']);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();

            if ($user) {
                $_SESSION['user'] = [
                    'id' => $data['user_id'],
                    'name' => $user['name'],
                    'api_key' => $data['apikey']
                ];
                error_log("Session set: " . print_r($_SESSION, true));
                $response = ['status' => 'success'];
            } else {
                $response = ['status' => 'error', 'message' => 'User not found'];
            }
        } catch (Exception $e) {
            error_log("Set Session Error: " . $e->getMessage());
            $response = ['status' => 'error', 'message' => 'Server error: ' . $e->getMessage()];
        }
    } else {
        $response = ['status' => 'error', 'message' => 'Invalid data'];
    }
} else {
    $response = ['status' => 'error', 'message' => 'Invalid request method'];
}

ob_end_clean();
header('Content-Type: application/json');
echo json_encode($response);
exit;
?>
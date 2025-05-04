<?php

class Database
{
    private $servername = "wheatley.cs.up.ac.za";
    private $username = "u22747363";
    private $password = "SCR7EUQUZ53URMJYOVUSEIFI7M65VCQP";
    private $database = "u22747363_products";
    private $conn;

    public static function instance()
    {
        static $instance = null;
        if ($instance === null) {
            $instance = new Database();
        }
        return $instance;
    }

    private function __construct()
    {
        try {
            $this->conn = new mysqli($this->servername, $this->username, $this->password, $this->database);
            if ($this->conn->connect_error) {
                die("Connection failed: " . $this->conn->connect_error);
            }
        } catch (Exception $e) {
            die("Database error: " . $e->getMessage());
        }
    }

    public function getConn()
    {
        return $this->conn;
    }

    public function __destruct()
    {
        $this->conn->close();
    }
}

$db = Database::instance();
$connection = $db->getConn();

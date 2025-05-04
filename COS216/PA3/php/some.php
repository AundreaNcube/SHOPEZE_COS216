<?php

private function getExchangeRate()
    {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => "https://wheatley.cs.up.ac.za/api/",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_POSTFIELDS => json_encode([
                "studentnum" => "u23539764",
                "apikey" => "e08840289df11ac183779c743c83f863",
                "type" => "GetCurrencyList"
            ]),
            CURLOPT_HTTPHEADER => [
                "Content-Type: application/json",
                "Accept: application/json"
            ]
        ]);
        $response = curl_exec($ch);
        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception("cURL error: " . $error);
        }
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($httpCode !== 200) {
            throw new Exception("Currency API returned status: " . $httpCode);
        }
        $data = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON response from currency API");
        }
        if (!isset($data['data']['ZAR'])) {
            throw new Exception("ZAR conversion rate not found in response");
        }
        return $data['data']['ZAR'];
    }

    ?>


<!-- miiiiiiiiiiinnnnnnnnneeeeeeeeeee -->


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
            // Fallback to mock data if Wheatley API fails.. just for testing,  remove 
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

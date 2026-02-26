<?php

namespace App\Libraries;

class CloudflareStream
{
    protected $accountId;
    protected $apiToken;

    public function __construct()
    {
        $this->accountId = getenv('CLOUDFLARE_ACCOUNT_ID') ?: env('CLOUDFLARE_ACCOUNT_ID');
        $this->apiToken = getenv('CLOUDFLARE_API_TOKEN') ?: env('CLOUDFLARE_API_TOKEN');
    }

    public function createLiveInput($name)
    {
        $url = "https://api.cloudflare.com/client/v4/accounts/{$this->accountId}/stream/live_inputs";
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'meta' => ['name' => $name],
            "enabled" => true,
            'recording' => [
                'mode' => 'automatic'
            ]
        ]));

        $headers = [
            "Authorization: Bearer {$this->apiToken}",
            "Content-Type: application/json"
        ];
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $result = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);

        if ($err) {
            log_message('error', 'Cloudflare cURL Error: ' . $err);
            return ['success' => false, 'errors' => [['message' => $err]]];
        }

        return json_decode($result, true);
    }

    public function deleteLiveInput($uid)
    {
        $url = "https://api.cloudflare.com/client/v4/accounts/{$this->accountId}/stream/live_inputs/{$uid}";
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");

        $headers = [
            "Authorization: Bearer {$this->apiToken}",
            "Content-Type: application/json"
        ];
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $result = curl_exec($ch);
        curl_close($ch);
        return json_decode($result, true);
    }

    public function toggleLiveInput($uid, $enabled = true)
    {
        $url = "https://api.cloudflare.com/client/v4/accounts/{$this->accountId}/stream/live_inputs/{$uid}";
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'enabled' => $enabled
        ]));

        $headers = [
            "Authorization: Bearer {$this->apiToken}",
            "Content-Type: application/json"
        ];
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $result = curl_exec($ch);
        curl_close($ch);
        return json_decode($result, true);
    }

    public function listVideos($liveInputId)
    {
        $url = "https://api.cloudflare.com/client/v4/accounts/{$this->accountId}/stream?liveInput={$liveInputId}";
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

        $headers = [
            "Authorization: Bearer {$this->apiToken}",
            "Content-Type: application/json"
        ];
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $result = curl_exec($ch);
        curl_close($ch);
        return json_decode($result, true);
    }
}

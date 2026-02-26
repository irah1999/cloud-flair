<?php
// Script to safely add recording_uid to database
$hostname = 'localhost';
$username = 'root';
$password = 'root';
$database = 'interview';

try {
    $db = new PDO("mysql:host=$hostname;dbname=$database", $username, $password);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Add recording_uid column safely
    $sql = "ALTER TABLE interviews ADD COLUMN IF NOT EXISTS recording_uid VARCHAR(255) AFTER cloudflare_uid";
    $db->exec($sql);
    echo "SUCCESS: Database memory updated for recordings.";
} catch (PDOException $e) {
    echo "DATABASE ERROR: " . $e->getMessage() . " - Please check if database 'interview' exists and user 'root' has access.";
}

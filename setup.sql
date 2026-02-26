CREATE DATABASE IF NOT EXISTS interview;
USE interview;

CREATE TABLE IF NOT EXISTS interviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_name VARCHAR(255) NOT NULL,
    candidate_email VARCHAR(255) NOT NULL,
    interview_code VARCHAR(50) UNIQUE NOT NULL,
    status ENUM('pending', 'ongoing', 'completed') DEFAULT 'pending',
    questions_json JSON,
    answers_json JSON,
    score INT DEFAULT 0,
    cloudflare_uid VARCHAR(255),
    live_stream_url TEXT,
    stream_key TEXT,
    started_at DATETIME,
    completed_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO interviews (candidate_name, candidate_email, interview_code, questions_json) 
VALUES ('Demo Candidate', 'demo@example.com', 'DEMO-123', '[]');

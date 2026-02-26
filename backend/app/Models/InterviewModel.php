<?php

namespace App\Models;

use CodeIgniter\Model;

class InterviewModel extends Model
{
    protected $table            = 'interviews';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'candidate_name',
        'candidate_email',
        'interview_code',
        'status',
        'questions_json',
        'answers_json',
        'score',
        'cloudflare_uid',
        'live_stream_url',
        'playback_url',
        'stream_key',
        'started_at',
        'completed_at',
        'recording_uid'
    ];

    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = ''; // No updated_at field in my schema
}

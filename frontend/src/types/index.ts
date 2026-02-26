export interface Question {
    id: number;
    question: string;
    options: string[];
    answer: string;
}

export interface Interview {
    id: number;
    candidate_name: string;
    candidate_email: string;
    interview_code: string;
    status: 'pending' | 'ongoing' | 'completed';
    questions_json: string; // From backend
    answers_json?: string;
    score: number;
    cloudflare_uid?: string;
    live_stream_url?: string;
    playback_url?: string;
    started_at: string;
    completed_at?: string;
    recording_uid?: string;
}

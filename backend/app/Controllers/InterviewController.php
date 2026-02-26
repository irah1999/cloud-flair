<?php

namespace App\Controllers;

use App\Models\InterviewModel;
use CodeIgniter\API\ResponseTrait;

class InterviewController extends BaseController
{
    use ResponseTrait;

    public function join()
    {
        $model = new InterviewModel();
        $code = $this->request->getVar('code');

        $interview = $model->where('interview_code', $code)->first();

        if (!$interview) {
            return $this->failNotFound('Interview code not found.');
        }

        // If status is pending OR status is ongoing but ANY stream details are missing
        if ($interview['status'] == 'pending' || ($interview['status'] == 'ongoing' && (empty($interview['live_stream_url']) || empty($interview['playback_url'])))) {
            $cf = new \App\Libraries\CloudflareStream();
            $input = $cf->createLiveInput("Interview-{$code}");

            log_message('debug', 'Cloudflare API Response: ' . json_encode($input));

            if (isset($input['success']) && $input['success'] === true && isset($input['result'])) {
                $result = $input['result'];

                // Defensive check for required keys
                if (!isset($result['webRTC']) || !isset($result['webRTCPlayback'])) {
                    return $this->fail('Cloudflare Stream created but WHIP/WHEP URLs are missing. Please ensure Stream is enabled on your account.');
                }

                $updateData = [
                    'status' => 'ongoing',
                    'started_at' => $interview['started_at'] ?? date('Y-m-d H:i:s'),
                    'cloudflare_uid' => $result['uid'],
                    'live_stream_url' => $result['webRTC']['url'],
                    'playback_url' => $result['webRTCPlayback']['url'],
                    'stream_key' => $result['rtmps']['streamKey'] ?? '',
                ];

                $model->update($interview['id'], $updateData);
                $interview = $model->find($interview['id']);
            } else {
                $errorMsg = isset($input['errors'][0]['message']) ? $input['errors'][0]['message'] : 'Unknown Error';
                return $this->fail('Failed to initialize Cloudflare Stream. Error: ' . $errorMsg);
            }
        }

        return $this->respond($interview);
    }

    public function submit()
    {
        $id = $this->request->getVar('id');
        $answers = $this->request->getVar('answers');
        $score = $this->request->getVar('score');

        $model = new InterviewModel();
        $interview = $model->find($id);

        if ($interview && !empty($interview['cloudflare_uid'])) {
            $cf = new \App\Libraries\CloudflareStream();
            // Explicitly disable the live input to force disconnect any lingering WHIP session
            // $cf->toggleLiveInput($interview['cloudflare_uid'], false);
        }

        $model->update($id, [
            'status' => 'completed',
            'answers_json' => json_encode($answers),
            'score' => $score,
            'completed_at' => date('Y-m-d H:i:s')
        ]);

        return $this->respond(['message' => 'Interview submitted successfully.']);
    }

    public function getDetails($code)
    {
        $model = new InterviewModel();
        $interview = $model->where('interview_code', $code)->first();

        if (!$interview) {
            return $this->failNotFound('Interview not found.');
        }

        // If interview is completed and we haven't saved the recording yet
        if ($interview['status'] == 'completed' && !empty($interview['cloudflare_uid'])) {
            $cf = new \App\Libraries\CloudflareStream();
            $videos = $cf->listVideos($interview['cloudflare_uid']);
            log_message('debug', 'Searching for recordings for UID ' . $interview['cloudflare_uid'] . ': ' . json_encode($videos));

            if (isset($videos['success']) && $videos['success'] === true && !empty($videos['result'])) {
                $latestVideo = $videos['result'][0];

                // Use playback_url column to store the ID if recording_uid doesn't exist
                // This is a workaround for the frozen database schema
                $model->update($interview['id'], [
                    'playback_url' => $latestVideo['uid']
                ]);
                $interview['recording_uid'] = $latestVideo['uid'];
                $interview['playback_url'] = $latestVideo['uid'];
            }
        }

        return $this->respond($interview);
    }
}

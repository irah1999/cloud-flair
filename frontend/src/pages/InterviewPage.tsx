import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { Question } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Camera, AlertCircle, CheckCircle2 } from 'lucide-react';
import staticQuestions from '../questions.json';

const InterviewPage = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const [questions] = useState<Question[]>(staticQuestions);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [interviewId, setInterviewId] = useState<number | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const fetchInterview = async () => {
            try {
                const response = await axios.post('/api/join', { code });
                setInterviewId(response.data.id);
                const streamData = await startCamera();
                if (streamData && response.data.live_stream_url) {
                    startWHIP(streamData, response.data.live_stream_url);
                }
            } catch (err: any) {
                console.error(err);
                setError(err.response?.data?.message || "Failed to join interview. Check your Cloudflare credentials.");
            }
        };
        fetchInterview();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [code]);

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startCamera = async () => {
        try {
            const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setStream(media);
            streamRef.current = media;
            if (videoRef.current) {
                videoRef.current.srcObject = media;
            }
            return media;
        } catch (err) {
            console.error("Camera access denied", err);
        }
    };

    const startWHIP = async (mediaStream: MediaStream, url: string) => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }]
        });
        pcRef.current = pc;

        mediaStream.getTracks().forEach(track => pc.addTrack(track, mediaStream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: offer.sdp,
                headers: { 'Content-Type': 'application/sdp' }
            });

            if (response.ok) {
                const answer = await response.text();
                await pc.setRemoteDescription({ type: 'answer', sdp: answer });
                console.log("WHIP Connection Established");
            }
        } catch (err) {
            console.error("WHIP Error:", err);
        }
    };

    const handleOptionSelect = (option: string) => {
        setAnswers({ ...answers, [questions[currentIdx].id]: option });
    };

    const nextQuestion = () => {
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(currentIdx + 1);
        } else {
            submitInterview();
        }
    };

    const submitInterview = async () => {
        console.log("Finishing interview, stopping hardware...");

        // 1. STOP CAMERA & MIC TRACKS (Turns off light)
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log("Stopped hardware track:", track.kind);
            });
            streamRef.current = null;
        }
        setStream(null);

        // 2. STOP WHIP CONNECTION (Stops OBS-like stream)
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
            console.log("WHIP Connection closed.");
        }

        // 3. CLEAR VIDEO ELEMENT
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        let score = 0;
        questions.forEach(q => {
            if (answers[q.id] === q.answer) score += 10;
        });

        try {
            // Tell backend to finalize and disable stream
            await axios.post('/api/submit', {
                id: interviewId,
                answers,
                score
            });

            // Short delay to ensure Cloudflare registers the disconnect
            setTimeout(() => {
                navigate(`/report/${code}`);
            }, 800);
        } catch (err) {
            console.error("Submission failed:", err);
            alert("Submission failed. Your results might not be saved.");
        }
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen space-y-4">
                <AlertCircle size={64} className="text-red-500" />
                <h1 className="text-2xl font-bold">Interview Setup Failed</h1>
                <p className="text-slate-500">{error}</p>
                <button onClick={() => navigate('/')} className="bg-blue-600 text-white px-6 py-2 rounded-xl">Go Home</button>
            </div>
        );
    }

    return (
        <div className="grid lg:grid-cols-3 gap-8 h-[calc(100vh-160px)]">
            {/* Left: Video Preview & Status */}
            <div className="lg:col-span-1 space-y-6">
                <div className="relative aspect-video bg-slate-800 rounded-3xl overflow-hidden border-4 border-slate-200 dark:border-slate-800 shadow-xl">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        className="w-full h-full object-cover mirror"
                    />
                    <div className="absolute top-4 left-4 bg-red-600 animate-pulse text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                        <div className="w-2 h-2 bg-white rounded-full"></div> LIVE RECORDING
                    </div>
                    {!stream && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 text-white p-6 text-center">
                            <Camera size={48} className="mb-4 text-slate-500" />
                            <p className="font-bold">Camera Access Required</p>
                            <p className="text-sm text-slate-400">Please enable your camera to continue the interview.</p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <AlertCircle size={20} className="text-blue-600" />
                        Interview Rules
                    </h3>
                    <ul className="text-sm space-y-3 text-slate-500 dark:text-slate-400">
                        <li>• Ensure you are in a well-lit room.</li>
                        <li>• Do not refresh this page.</li>
                        <li>• Any browser switch will be flagged.</li>
                        <li>• TA Manager is live monitoring.</li>
                    </ul>
                </div>
            </div>

            {/* Right: Questions Area */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-700 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">Question {currentIdx + 1} of {questions.length}</span>
                    <div className="w-48 h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                            className="h-full bg-blue-600"
                        />
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIdx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        <h2 className="text-2xl font-bold leading-snug">
                            {questions[currentIdx].question}
                        </h2>

                        <div className="grid gap-4">
                            {questions[currentIdx].options.map((option, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleOptionSelect(option)}
                                    className={`w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center justify-between group ${answers[questions[currentIdx].id] === option
                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-600/10'
                                        : 'border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-800'
                                        }`}
                                >
                                    <span className="font-medium">{option}</span>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${answers[questions[currentIdx].id] === option
                                        ? 'border-blue-600 bg-blue-600 text-white'
                                        : 'border-slate-300 dark:border-slate-600 group-hover:border-blue-600'
                                        }`}>
                                        {answers[questions[currentIdx].id] === option && <CheckCircle2 size={16} />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>

                <div className="mt-12 flex justify-end">
                    <button
                        onClick={nextQuestion}
                        disabled={!answers[questions[currentIdx].id]}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        {currentIdx === questions.length - 1 ? 'Finish Interview' : 'Next Question'}
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InterviewPage;

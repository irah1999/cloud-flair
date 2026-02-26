import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import type { Interview } from '../types';
import { Monitor as MonitorIcon, User, Mail, ShieldAlert, Wifi } from 'lucide-react';

const Monitor = () => {
    const { code } = useParams();
    const [interview, setInterview] = useState<Interview | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);

    useEffect(() => {
        const pollInterval = setInterval(() => {
            fetchInterview();
        }, 5000);

        fetchInterview();
        return () => {
            clearInterval(pollInterval);
            if (pcRef.current) {
                pcRef.current.close();
            }
        };
    }, [code]);

    const fetchInterview = async () => {
        try {
            const response = await axios.get(`/api/details/${code}`);
            setInterview(response.data);
            if (response.data.playback_url && !pcRef.current && response.data.status === 'ongoing') {
                startWHEP(response.data.playback_url);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const startWHEP = async (url: string) => {
        if (pcRef.current) return;

        console.log("Starting WHEP Connection...");
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }]
        });
        pcRef.current = pc;

        pc.addTransceiver('video', { direction: 'recvonly' });
        pc.addTransceiver('audio', { direction: 'recvonly' });

        pc.ontrack = (event) => {
            const stream = event.streams[0];
            console.log("WHEP Track Received:", stream.id);

            if (videoRef.current && videoRef.current.srcObject !== stream) {
                videoRef.current.srcObject = stream;
                console.log("Attached stream to video element");

                // Wait for metadata to load before playing
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch(e => {
                        if (e.name !== 'AbortError') console.error("Play error:", e);
                    });
                };
            }
            setIsPlaying(true);
        };

        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                pc.close();
                pcRef.current = null;
                setIsPlaying(false);
            }
        };

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
                console.log("WHEP Connection Successful");
            } else {
                pc.close();
                pcRef.current = null;
                setIsPlaying(false);
            }
        } catch (err) {
            console.error("WHEP Error:", err);
            pc.close();
            pcRef.current = null;
            setIsPlaying(false);
        }
    };

    if (loading) return <div className="text-center py-20">Connecting to Stream...</div>;
    if (!interview) return <div className="text-center py-20">No active session for this code.</div>;

    return (
        <div className="max-w-6xl mx-auto grid lg:grid-cols-4 gap-8">
            {/* Sidebar: Candidate Info */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                        <User size={40} />
                    </div>
                    <h2 className="text-xl font-bold">{interview.candidate_name}</h2>
                    <div className="text-slate-500 text-sm mb-6 flex items-center gap-1 uppercase tracking-wider font-bold">
                        <div className={`w-2 h-2 rounded-full ${interview.status === 'ongoing' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        {interview.status}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3 text-sm">
                            <Mail size={16} className="text-slate-400" />
                            <span className="truncate">{interview.candidate_email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Wifi size={16} className="text-green-500" />
                            <span className="text-green-500 font-bold">Connected</span>
                        </div>
                    </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-3xl border border-red-100 dark:border-red-900/30">
                    <h3 className="text-red-600 dark:text-red-400 font-bold flex items-center gap-2 mb-2">
                        <ShieldAlert size={18} /> Anti-Cheat
                    </h3>
                    <p className="text-xs text-red-700/70 dark:text-red-400/70">
                        Automated alerts for browser tab switch, multiple people detection, or background noise.
                    </p>
                    <div className="mt-4 space-y-2">
                        <div className="p-2 bg-white/50 dark:bg-slate-900/50 rounded-lg text-[10px] font-mono">
                            [SYSTEM] No alerts detected.
                        </div>
                    </div>
                </div>
            </div>

            {/* Main: Live Feed */}
            <div className="lg:col-span-3 space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-100 dark:border-slate-700 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-8 left-8 z-10 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-2 border border-white/20">
                        <div className={`w-2 h-2 ${interview.status === 'ongoing' ? 'bg-red-500 animate-pulse' : 'bg-slate-400'} rounded-full`}></div>
                        {interview.status === 'ongoing' ? 'LIVE FEED : CANDIDATE_01' : 'INTERVIEW RECORDING'}
                    </div>
                    <div className="aspect-video bg-slate-900 rounded-2xl relative flex items-center justify-center overflow-hidden">
                        {interview.status === 'ongoing' ? (
                            <>
                                {/* <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-lg border border-slate-800"> */}
                                <iframe
                                    src={`https://customer-3s52vq0sqc5xeoq8.cloudflarestream.com/${interview.cloudflare_uid}/iframe?preload=auto&autoplay=true`}
                                    className="w-full h-full border-none"
                                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                                    allowFullScreen
                                />
                                {/* </div> */}
                                {/* {(!isPlaying || !videoRef.current?.srcObject) && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-20">
                                        <div className="text-center">
                                            <div className="inline-block p-4 rounded-full bg-blue-600/10 text-blue-600 mb-4 animate-bounce">
                                                <MonitorIcon size={48} />
                                            </div>
                                            <p className="text-white font-bold text-xl">Connecting to WHEP...</p>
                                        </div>
                                    </div>
                                )} */}
                            </>
                        ) : (
                            interview.recording_uid ? (
                                <iframe
                                    src={`https://customer-3s52vq0sqc5xeoq8.cloudflarestream.com/${interview.recording_uid}/iframe?preload=auto`}
                                    className="w-full h-full border-none"
                                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                                    allowFullScreen
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-20 space-y-4">
                                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-white font-bold">Interview Completed</p>
                                    <p className="text-slate-500 text-sm">Processing recording...</p>
                                </div>
                            )
                        )}
                        {interview.status === 'pending' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-20">
                                <div className="text-center text-slate-500">
                                    <MonitorIcon size={64} className="mx-auto mb-4 opacity-20" />
                                    <p>Waiting for candidate to join...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                        <h4 className="font-bold text-sm uppercase text-slate-400 tracking-widest mb-4">Real-time Progress</h4>
                        <div className="flex items-center gap-4">
                            <div className="text-4xl font-black">{interview.score}</div>
                            <div className="text-xs text-slate-500">Current Score based on answered questions.</div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                        <h4 className="font-bold text-sm uppercase text-slate-400 tracking-widest mb-4">Transcription</h4>
                        <div className="text-xs text-slate-500 italic">
                            Candidate is currently reading Question {interview.score / 10 + 1}...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Monitor;

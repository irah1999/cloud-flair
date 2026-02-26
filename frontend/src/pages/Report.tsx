import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import type { Interview } from '../types';
import { motion } from 'framer-motion';
import { Trophy, CheckCircle, Clock, Video } from 'lucide-react';

const Report = () => {
    const { code } = useParams();
    const [interview, setInterview] = useState<Interview | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const response = await axios.get(`/api/details/${code}`);
                setInterview(response.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [code]);

    if (loading) return <div className="text-center py-20">Loading Report...</div>;
    if (!interview) return <div className="text-center py-20">Interview not found.</div>;

    const answers = interview.answers_json ? JSON.parse(interview.answers_json) : {};

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            {/* Header Summary */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Trophy size={200} />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <h2 className="text-4xl font-black mb-2">{interview.candidate_name}</h2>
                        <p className="text-blue-100 flex items-center gap-2">
                            <Clock size={16} /> Completed on {new Date(interview.completed_at!).toLocaleString()}
                        </p>
                        <div className="mt-6 inline-flex bg-white/20 backdrop-blur-md rounded-full px-6 py-2 text-sm font-bold uppercase tracking-wider">
                            {interview.interview_code}
                        </div>
                    </div>

                    <div className="text-center">
                        <div className="text-7xl font-black mb-2">{interview.score}%</div>
                        <p className="text-blue-200 font-bold uppercase tracking-widest text-sm">Overall Score</p>
                    </div>
                </div>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Left: Video Recording (Mock) */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
                        <h3 className="font-bold flex items-center gap-2 mb-4">
                            <Video className="text-blue-600" size={18} /> Recording
                        </h3>
                        {interview.recording_uid ? (
                            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-lg border border-slate-800">
                                <iframe
                                    src={`https://customer-3s52vq0sqc5xeoq8.cloudflarestream.com/${interview.recording_uid}/iframe?preload=auto&autoplay=false`}
                                    className="w-full h-full border-none"
                                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                                    allowFullScreen
                                />
                            </div>
                        ) : (
                            <div className="aspect-video bg-black rounded-2xl flex flex-col items-center justify-center text-slate-500 text-sm italic p-6 text-center space-y-4">
                                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <p>Video is being processed by Cloudflare.</p>
                                <p className="text-[10px] opacity-50 NOT-italic">This usually takes 1-2 minutes after the interview ends.</p>
                            </div>
                        )}
                        <a
                            href={interview.recording_uid ? `https://customer-3s52vq0sqc5xeoq8.cloudflarestream.com/${interview.recording_uid}/downloads/default.mp4` : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`block w-full mt-4 py-3 rounded-xl font-bold text-sm transition-all text-center ${interview.recording_uid ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                            onClick={(e) => !interview.recording_uid && e.preventDefault()}
                        >
                            Download Recording
                        </a>
                    </div>

                    <Link to="/" className="block text-center text-blue-600 font-bold py-4 rounded-xl border-2 border-blue-600/20 hover:bg-blue-600/10 transition-all">
                        Back to Home
                    </Link>
                </div>

                {/* Right: Detailed Q&A */}
                <div className="md:col-span-2 space-y-4">
                    <h3 className="text-xl font-bold px-4">Question Summary</h3>
                    <div className="space-y-4">
                        {/* We don't have the questions full text here, but in a real app we'd fetch them or have them in the report payload */}
                        <p className="text-sm text-slate-500 px-4 italic">Showing answer choices for verification.</p>

                        {Object.entries(answers).map(([id, answer]) => (
                            <div key={id} className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center group hover:shadow-lg transition-all">
                                <div>
                                    <span className="text-xs text-slate-400 font-mono">Q-ID: {id}</span>
                                    <p className="font-bold text-lg mt-1">{answer as string}</p>
                                </div>
                                <div className="text-green-500">
                                    <CheckCircle size={24} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Report;

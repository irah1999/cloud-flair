import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Play, ShieldCheck, Monitor as MonitorIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code) return;
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/api/join', { code });
            if (response.data) {
                navigate(`/interview/${code}`);
            }
        } catch (err: any) {
            setError(err.response?.data?.messages?.error || 'Failed to join interview. Check your code.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center py-12">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
            >
                <h2 className="text-5xl font-extrabold leading-tight">
                    Secure AI-Powered <br />
                    <span className="text-blue-600">Interview Platform</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-lg">
                    Attend your interview with real-time video streaming and interactive assessments.
                    Your session is recorded and monitored for a fair evaluation.
                </p>

                <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50">
                        <ShieldCheck className="text-blue-600 mb-2" />
                        <h3 className="font-bold">Secure</h3>
                        <p className="text-sm text-slate-500">Encrypted stream</p>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50">
                        <MonitorIcon className="text-blue-600 mb-2" />
                        <h3 className="font-bold">Live</h3>
                        <p className="text-sm text-slate-500">Real-time monitoring</p>
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700"
            >
                <h3 className="text-2xl font-bold mb-6 text-center">Join Interview</h3>
                <form onSubmit={handleJoin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-slate-400">Interview Code</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="e.g. INT-7890"
                            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
                    >
                        {loading ? 'Joining...' : <>Join Now <Play size={18} fill="currentColor" /></>}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-slate-400">
                    TA Manager? Use the code to <a href={`/monitor/${code}`} className="text-blue-600 hover:underline">Monitor Live</a>
                </p>
            </motion.div>
        </div>
    );
};

export default Home;

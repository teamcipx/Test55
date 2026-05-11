import { Link } from "react-router";
import { Clock } from "lucide-react";

export default function PendingApproval() {
  return (
    <div className="max-w-lg mx-auto w-full mt-10 md:mt-24 text-center px-4">
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-10 backdrop-blur-sm shadow-2xl flex flex-col items-center">
        <div className="w-20 h-20 bg-cyan-900/30 text-cyan-400 border border-cyan-800/50 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <Clock className="w-10 h-10" />
        </div>
        
        <h2 className="text-2xl md:text-3xl font-serif text-white mb-4">
          Application Received
        </h2>
        
        <p className="text-sm text-zinc-400 mb-8 leading-relaxed max-w-sm">
          Thank you for applying to Hijabii. Your account is currently pending admin approval to ensure community quality. You will be able to log in once approved.
        </p>

        <Link 
          to="/" 
          className="px-6 py-2.5 rounded-full border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors text-xs font-bold uppercase tracking-widest"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}

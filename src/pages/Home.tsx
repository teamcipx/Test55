import { useState, useEffect } from "react";
import { ArrowRight, Users, Shield, Zap, Lock, Flame } from "lucide-react";
import { Link } from "react-router";

const heroImages = [
  "https://i.ibb.co.com/zWJzF3Bg/nothing-like-a-hijabis-ass-v0-7tk3wesr5s5b1.jpg",
  "https://i.ibb.co.com/KPF5LsD/1778564278241.jpg",
  "https://i.ibb.co.com/Rph5MT1m/images-14-11.jpg"
];

export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000); // Change image every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#050505] min-h-[calc(100vh-104px)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center px-4 md:px-10 py-16 md:py-24 relative overflow-hidden md:border-b border-zinc-900">
        {/* Background Image / Effects */}
        <div className="absolute inset-0 z-0 bg-black">
          {heroImages.map((src, index) => (
             <div
               key={src}
               className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
             >
               <img 
                 src={src} 
                 alt="Hero Background" 
                 className={`w-full h-full object-cover opacity-40 mix-blend-luminosity transform scale-105 transition-transform duration-[10000ms] ease-linear ${index === currentImageIndex ? 'scale-100' : 'scale-105'}`}
               />
             </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 via-[#050505]/80 to-[#050505]"></div>
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/20 blur-[120px] rounded-full pointer-events-none" />
        </div>
        
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-400 font-bold uppercase tracking-widest mb-8">
            <span className="flex h-2 w-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
            18+ Exclusive Global Community
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-white mb-6 leading-tight">
            The ultimate anonymous space for <br className="hidden md:block" />
            <span className="italic text-red-500">
              unfiltered sharing.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 font-medium max-w-2xl mb-10 leading-relaxed">
            No VPN required. No tracking. 100% anonymous interactions across 80+ countries. The safest place to connect, chat, and explore hot topics and exclusive media.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/signup" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-red-600 text-white font-bold uppercase tracking-widest hover:bg-red-500 transition-colors text-xs shadow-lg shadow-red-900/20"
            >
              Enter Hijabii
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/features" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors text-xs font-bold uppercase tracking-widest"
            >
              Explore Features
            </Link>
          </div>
        </div>
      </section>

      {/* Hot Topics & Content Preview Placeholder */}
      <section className="py-12 px-4 md:px-10 border-b border-zinc-900 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-xl font-serif text-white flex items-center gap-2">
               <Flame className="text-red-500 w-6 h-6" /> Trending Now
             </h3>
             <Link to="/community" className="text-xs uppercase tracking-widest text-zinc-500 hover:text-red-400 transition-colors">View All &rarr;</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "https://images.unsplash.com/photo-1560074213-9118c7bc76f2?auto=format&fit=crop&q=80",
              "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80",
              "https://images.unsplash.com/photo-1534008757030-27299c4371b6?auto=format&fit=crop&q=80",
              "https://images.unsplash.com/photo-1510257321033-6bc31289fe80?auto=format&fit=crop&q=80"
            ].map((img, i) => (
              <div key={i} className="group relative aspect-[4/5] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                {/* Image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700 opacity-60 mix-blend-luminosity"
                  style={{ backgroundImage: `url(${img})` }}
                />
                <div className={`absolute inset-0 opacity-40 blur-xl ${i%2===0 ? 'bg-red-900/40' : 'bg-cyan-900/30'}`} />
                <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent">
                  <div className="flex items-center gap-2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Lock className="w-3 h-3 text-red-500" />
                    <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Members Only</span>
                  </div>
                  <h4 className="text-white font-medium text-sm">Exclusive Gallery #{i + 1}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Site Features Section */}
      <section className="py-16 md:py-24 px-4 md:px-10">
        <div className="max-w-7xl mx-auto w-full">
          <div className="mb-12">
            <h2 className="text-3xl lg:text-4xl font-serif text-white mb-4">Why join Hijabii?</h2>
            <p className="text-zinc-400 max-w-xl text-lg">Experience a platform built for true anonymity, global connection, and unfiltered media.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex flex-col p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="h-10 w-10 bg-red-900/30 text-red-400 rounded flex items-center justify-center mb-6 border border-red-800/50">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-red-400 text-xs font-bold uppercase tracking-widest mb-2">Hi-Security & Anonymous</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                No tracking, no logs. Browse and interact completely anonymously without needing a VPN. Your identity is your secret.
              </p>
            </div>
            
            <div className="flex flex-col p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="h-10 w-10 bg-red-900/30 text-red-400 rounded flex items-center justify-center mb-6 border border-red-800/50">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-red-400 text-xs font-bold uppercase tracking-widest mb-2">Global Reach</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Connect with members from 80+ countries. Chat privately, view profiles, and post stories seamlessly with a diverse community.
              </p>
            </div>
            
            <div className="flex flex-col p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="h-10 w-10 bg-red-900/30 text-red-400 rounded flex items-center justify-center mb-6 border border-red-800/50">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-red-400 text-xs font-bold uppercase tracking-widest mb-2">Unrestricted Media</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Complete freedom to share and view media—including adult pix and video—securely. Share your private story your way.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

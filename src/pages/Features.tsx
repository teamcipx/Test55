import React from "react";
import { ShieldCheck, Zap, Users, MessageSquare, Globe, Bell } from "lucide-react";
import { motion } from "motion/react";

export default function Features() {
  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Community Driven",
      description: "Connect with like-minded individuals, share your thoughts, and build lasting relationships."
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Real-time Chat",
      description: "Instantly message anyone in the community with our lightning-fast direct messaging system."
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Global Reach",
      description: "Access from anywhere in the world and connect with our diverse international user base."
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Secure & Private",
      description: "Your data is encrypted and secure. We take your privacy seriously with industry-leading standards."
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Smart Notifications",
      description: "Stay in the loop with intelligent notifications for replies, likes, and mentions."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast",
      description: "Built on modern architectures ensuring quick load times and smooth interactions."
    }
  ];

  return (
    <div className="max-w-6xl mx-auto w-full py-16 px-4">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-serif text-white mb-4"
        >
          Features
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-zinc-400 max-w-2xl mx-auto"
        >
          Explore everything our platform has to offer. Designed and built to provide the best possible experience for our community.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + idx * 0.1 }}
            className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-2xl hover:bg-zinc-800/40 transition-colors"
          >
            <div className="w-12 h-12 bg-cyan-950/50 rounded-xl flex items-center justify-center text-cyan-400 mb-6 border border-cyan-900/30">
              {feature.icon}
            </div>
            <h3 className="text-xl text-white font-medium mb-3">{feature.title}</h3>
            <p className="text-zinc-500 leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

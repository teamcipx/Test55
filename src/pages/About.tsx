import React from "react";
import { Link } from "react-router";

export default function About() {
  return (
    <div className="max-w-4xl mx-auto w-full py-12 px-4 min-h-[calc(100vh-140px)]">
      <h1 className="text-4xl font-serif text-white mb-6">About Us</h1>
      <div className="prose prose-invert prose-p:text-zinc-300 prose-headings:text-white max-w-none">
        <p className="text-lg leading-relaxed mb-6">
          Welcome to HIJABII, a secure and exclusive community connecting individuals worldwide. 
          We provide a safe space for meaningful discussions, securely managed profiles, and 
          monitored access for a better community experience.
        </p>

        <h2 className="text-2xl mt-8 mb-4 font-serif">Our Mission</h2>
        <p className="mb-6">
          Our mission is to foster a safe, verified network of individuals who share common 
          values and interests. By implementing strict approval policies and secure login, 
          we ensure that everyone you interact with is a real member of our platform.
        </p>

        <h2 className="text-2xl mt-8 mb-4 font-serif">Community Guidelines</h2>
        <ul className="list-disc pl-6 space-y-2 mb-8 text-zinc-300">
          <li>Respect everyone in the community.</li>
          <li>Do not share spam, external links (except from hijab.site).</li>
          <li>Any form of harassment will result in immediate ban and account deletion.</li>
          <li>Ensure that your profile details are accurate and up-to-date.</li>
        </ul>

        <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 text-center mt-12">
          <h3 className="text-xl text-white mb-2 font-medium">Ready to join our community?</h3>
          <p className="text-zinc-400 mb-6 text-sm">Become a member today and start connecting.</p>
          <Link to="/signup" className="inline-block bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-colors shadow-lg shadow-cyan-900/20">
            Sign Up Now
          </Link>
        </div>
      </div>
    </div>
  );
}

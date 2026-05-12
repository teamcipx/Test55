import React, { useState, useEffect, useRef } from "react";
import { supabase, hasSupabaseConfig } from "../lib/supabase";
import { uploadToImgBB } from "../lib/imgbb";
import { CheckCircle2, AlertCircle, Upload, Save, Lock, User } from "lucide-react";
import UserBadges from "../components/UserBadges";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Profile Form States
  const [displayName, setDisplayName] = useState("");
  const [realName, setRealName] = useState("");
  const [socialLink, setSocialLink] = useState("");
  const [country, setCountry] = useState("");
  const [interest, setInterest] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  
  // Password Change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hasSupabaseConfig) {
      fetchProfile();
    } else {
      setLoading(false);
      setMessage({ type: 'error', text: 'Supabase is not configured.' });
    }
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase!.auth.getUser();
    if (user) {
      setUser(user);
      const { data, error } = await supabase!.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || "");
        setRealName(data.real_name || "");
        setSocialLink(data.telegram_or_fb || "");
        setCountry(data.country || "");
        setInterest(data.interest || "");
        setRelationshipStatus(data.relationship_status || "");
        setAge(data.age?.toString() || "");
        setPhone(data.phone || "");
        setBio(data.bio || "");
        setAvatarPreview(data.avatar_url || null);
      } else if (error) {
        console.error("Error fetching profile", error);
      }
    }
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);

    try {
      let avatarUrl = profile?.avatar_url;
      if (avatarFile) {
        const uploadedUrl = await uploadToImgBB(avatarFile);
        if (uploadedUrl) avatarUrl = uploadedUrl;
        else throw new Error("Failed to upload new profile picture.");
      }

      const { error } = await supabase!.from('profiles').update({
        display_name: displayName,
        real_name: realName,
        interest,
        bio,
        relationship_status: relationshipStatus,
        age: parseInt(age) || null,
        avatar_url: avatarUrl
      }).eq('id', user.id);

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      setAvatarFile(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match or are empty.' });
      return;
    }

    setChangingPassword(true);
    setMessage(null);

    try {
      const { error } = await supabase!.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setMessage({ type: 'success', text: 'Password updated successfully. You have been logged out, please sign in again.' });
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center min-h-[50vh] text-zinc-400">
        <User className="w-12 h-12 mb-4 text-zinc-700" />
        <h2 className="text-xl font-serif text-white mb-2">Not Logged In</h2>
        <p>Please log in to view and edit your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full py-12 px-4 space-y-8">
      <div className="mb-4">
        <h1 className="text-3xl font-serif text-white mb-2">My Profile</h1>
        <p className="text-sm text-zinc-500">Manage your personal information and security settings.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-md flex items-start gap-3 text-sm ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Basic Info */}
        <div className="md:col-span-1 space-y-6">
          <div className={`bg-zinc-900/30 border rounded-xl p-6 backdrop-blur-sm text-center flex flex-col items-center relative overflow-hidden ${profile?.is_premium ? 'border-amber-500 shadow-xl shadow-amber-500/10' : 'border-zinc-800'}`}>
            <div className={`absolute top-0 right-0 w-48 h-48 blur-[80px] rounded-full pointer-events-none opacity-20 ${profile?.is_admin ? 'bg-red-500' : profile?.is_premium ? 'bg-amber-500 opacity-40' : 'bg-cyan-500'}`} />
            
            <div 
              className={`relative z-10 w-32 h-32 rounded-full border-2 flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-colors group bg-zinc-950 mb-4 shadow-xl ${profile?.is_premium ? 'border-amber-500 shadow-amber-500/30 border-solid' : 'border-dashed border-zinc-700 hover:border-cyan-500'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarPreview ? (
                <>
                  <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-opacity" />
                  <div className="absolute inset-0 hidden group-hover:flex items-center justify-center">
                    <Upload className="w-6 h-6 text-white drop-shadow-md" />
                  </div>
                </>
              ) : (
                <User className="w-10 h-10 text-zinc-600" />
              )}
            </div>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
            />
             <h3 className="text-lg font-medium text-white">@{profile?.username || "user"}</h3>
             <UserBadges user={profile} />
             <p className="text-xs text-zinc-500 mt-4 break-all">{user.email}</p>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-500" /> Change Password
            </h3>
            <form onSubmit={updatePassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" 
                  placeholder="••••••••" 
                  minLength={8}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Confirm Password</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" 
                  placeholder="••••••••" 
                  minLength={8}
                />
              </div>
              <button 
                type="submit"
                disabled={changingPassword || !newPassword}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
              >
                {changingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Edit Profile Details */}
        <div className="md:col-span-2">
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-serif text-white mb-6">Profile Settings</h3>
            
            <form onSubmit={updateProfile} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-500">Display Name</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-500">Real Name</label>
                  <input 
                    type="text" 
                    value={realName}
                    onChange={e => setRealName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Bio <span className="text-zinc-600">({bio.length}/500)</span></label>
                <textarea 
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  maxLength={500}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none min-h-[80px] resize-none" 
                  placeholder="Tell us a little bit about yourself..."
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-1 opacity-60">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-500">Telegram/FB Link (Cannot be changed)</label>
                  <input 
                    type="text" 
                    value={socialLink}
                    disabled
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-500 cursor-not-allowed outline-none" 
                  />
                </div>
                <div className="space-y-1 opacity-60">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-500">Phone (Cannot be changed)</label>
                  <input 
                    type="text" 
                    value={phone}
                    disabled
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-500 cursor-not-allowed outline-none" 
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-5">
                <div className="space-y-1 opacity-60">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-500">Country (Cannot be changed)</label>
                  <input 
                    type="text" 
                    value={country}
                    disabled
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-500 cursor-not-allowed outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-500">Age</label>
                  <input 
                    type="number" 
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-500">Primary Interest</label>
                  <input 
                    type="text" 
                    value={interest}
                    onChange={e => setInterest(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-1 mt-4">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Relationship Status</label>
                <select 
                  value={relationshipStatus}
                  onChange={e => setRelationshipStatus(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" 
                >
                  <option value="">Prefer not to say</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>

              <div className="pt-4 mt-6 border-t border-zinc-800 flex justify-end">
                <button 
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

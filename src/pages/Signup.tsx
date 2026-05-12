import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import { uploadToImgBB } from "../lib/imgbb";
import { supabase, hasSupabaseConfig } from "../lib/supabase";
import { cn } from "../lib/utils";

const signupSchema = z.object({
  realName: z.string().min(2, "Real name is required"),
  displayName: z.string().min(2, "Display name is required"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  socialLink: z.string().min(2, "Telegram or Facebook link is required"),
  country: z.string().min(1, "Please select a country"),
  interest: z.string().min(2, "Interest is required"),
  age: z.string().min(1, "Age is required"),
  gender: z.string().min(1, "Please select a gender"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
});

type SignupFormValues = z.infer<typeof signupSchema>;

const heroImages = [
  "https://i.ibb.co.com/zWJzF3Bg/nothing-like-a-hijabis-ass-v0-7tk3wesr5s5b1.jpg",
  "https://i.ibb.co.com/KPF5LsD/1778564278241.jpg",
  "https://i.ibb.co.com/Rph5MT1m/images-14-11.jpg"
];

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur"
  });

  React.useEffect(() => {
    if (hasSupabaseConfig) {
      supabase!.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          navigate("/dashboard");
        }
      });
    }
  }, [navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setGlobalError(null);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) fieldsToValidate = ["email", "password"];
    if (step === 2) {
      fieldsToValidate = ["username", "displayName", "realName"];
      if (!avatarFile) {
        setGlobalError("Please upload a profile picture.");
        return;
      }
    }
    
    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) {
      setGlobalError(null);
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    setGlobalError(null);
  };

  const onSubmit = async (data: SignupFormValues) => {
    setGlobalError(null);

    if (!hasSupabaseConfig) {
      setGlobalError("Database is not configured. Please add Supabase credentials to .env");
      return;
    }

    if (!avatarFile) {
      setGlobalError("Please upload a profile picture.");
      return;
    }

    setUploading(true);
    try {
      // 0. Check uniqueness
      const { data: existingTg } = await supabase!.from('profiles').select('id').eq('telegram_or_fb', data.socialLink).limit(1);
      if (existingTg && existingTg.length > 0) throw new Error("This Telegram username is already in use.");
      
      if (data.phone) {
        const { data: existingPhone } = await supabase!.from('profiles').select('id').eq('phone', data.phone).limit(1);
        if (existingPhone && existingPhone.length > 0) throw new Error("This phone number is already in use.");
      }

      const { data: existingUsername } = await supabase!.from('profiles').select('id').eq('username', data.username).limit(1);
      if (existingUsername && existingUsername.length > 0) throw new Error("This username is already taken.");

      // 1. Upload Image
      const avatarUrl = await uploadToImgBB(avatarFile);
      if (!avatarUrl) {
        throw new Error("Failed to upload profile picture. Check your ImgBB API Key.");
      }

      // 2. Sign up user
      const { data: authData, error: signUpError } = await supabase!.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // 3. Create profile entry (pending approval)
        const { error: profileError } = await supabase!.from('profiles').insert({
          id: authData.user.id,
          real_name: data.realName,
          display_name: data.displayName,
          username: data.username,
          avatar_url: avatarUrl,
          phone: data.phone || null,
          telegram_or_fb: data.socialLink,
          country: data.country,
          interest: data.interest,
          age: Number(data.age),
          gender: data.gender,
          is_approved: false, // Explicitly false
        });

        if (profileError) {
          console.error("Profile Error:", profileError);
          // Don't throw here completely, user is created but profile failed
          throw new Error("Account created but failed to save profile details. Please contact support.");
        }
      }

      // 4. Redirect to pending approval
      navigate("/pending-approval");

    } catch (error: any) {
      setGlobalError(error.message || "An error occurred during signup.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-104px)] flex flex-col py-12 px-4 -mt-2">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        {heroImages.map((src, index) => (
           <div
             key={src}
             className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
           >
             <img 
               src={src} 
               alt="Background" 
               className={`w-full h-full object-cover opacity-20 mix-blend-luminosity transform scale-105 transition-transform duration-[10000ms] ease-linear ${index === currentImageIndex ? 'scale-100' : 'scale-105'}`}
             />
           </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#050505]/95 to-[#050505]"></div>
      </div>

      <div className="relative z-10 max-w-lg mx-auto w-full">
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6 md:p-10 backdrop-blur-xl shadow-2xl">
          <div className="mb-6">
            <h2 className="text-2xl font-serif text-white mb-2">Create Account</h2>
            <div className="flex gap-2 mb-4">
               {[1, 2, 3].map(i => (
                 <div key={i} className={`h-1.5 flex-1 rounded-full ${step >= i ? 'bg-cyan-500' : 'bg-zinc-800'}`} />
               ))}
            </div>
            <p className="text-sm text-zinc-500">
              {step === 1 && "Step 1: Account Credentials"}
              {step === 2 && "Step 2: Profile Identify"}
              {step === 3 && "Step 3: Personal Details"}
            </p>
          </div>

          {globalError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-md mb-6 flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{globalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Email Address *</label>
                <input type="email" {...register("email")} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none focus:ring-1 focus:ring-cyan-500" placeholder="john@example.com" />
                {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Password *</label>
                <input type="password" {...register("password")} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none focus:ring-1 focus:ring-cyan-500" placeholder="••••••••" />
                {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
             <div className="space-y-4">
               {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-4 mb-2">
                  <div 
                    className={cn(
                      "relative w-28 h-28 rounded-full border-2 border-dashed flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-colors group bg-zinc-950 box-border",
                      avatarPreview ? "border-cyan-500" : "border-zinc-700 hover:border-cyan-500"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {avatarPreview ? (
                      <>
                        <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center">
                          <Upload className="w-6 h-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-neutral-500 mb-2 group-hover:text-neutral-300 transition-colors" />
                        <span className="text-[10px] font-medium text-neutral-500 group-hover:text-neutral-300">Upload Photo</span>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                  />
                  {(!avatarFile && isSubmitting) && (
                    <p className="text-red-400 text-xs text-center">Profile picture is required</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-500">Username *</label>
                  <input {...register("username")} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none focus:ring-1 focus:ring-cyan-500" placeholder="john_doe" />
                  {errors.username && <p className="text-red-400 text-xs">{errors.username.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-500">Display Name *</label>
                  <input {...register("displayName")} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none focus:ring-1 focus:ring-cyan-500" placeholder="MasterNinja" />
                  {errors.displayName && <p className="text-red-400 text-xs">{errors.displayName.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-500">Real Name *</label>
                  <input {...register("realName")} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none focus:ring-1 focus:ring-cyan-500" placeholder="John Doe" />
                  {errors.realName && <p className="text-red-400 text-xs">{errors.realName.message}</p>}
                </div>
             </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1 col-span-2">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-500">Telegram or Facebook Profile *</label>
                    <input {...register("socialLink")} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none focus:ring-1 focus:ring-cyan-500" placeholder="t.me/username" />
                    {errors.socialLink && <p className="text-red-400 text-xs">{errors.socialLink.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-500">Phone Number (Optional)</label>
                    <input {...register("phone")} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none focus:ring-1 focus:ring-cyan-500" placeholder="+1 234 567 8900" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-500">Country *</label>
                    <select {...register("country")} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none focus:ring-1 focus:ring-cyan-500 appearance-none">
                      <option value="">Select a country</option>
                      <option value="US">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                      <option value="IN">India</option>
                      <option value="BD">Bangladesh</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.country && <p className="text-red-400 text-xs">{errors.country.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-500">Age *</label>
                    <input type="number" {...register("age")} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none focus:ring-1 focus:ring-cyan-500" placeholder="18" />
                    {errors.age && <p className="text-red-400 text-xs">{errors.age.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-500">Gender *</label>
                    <select {...register("gender")} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none focus:ring-1 focus:ring-cyan-500 appearance-none">
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                    {errors.gender && <p className="text-red-400 text-xs">{errors.gender.message}</p>}
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-500">Primary Interest *</label>
                    <input {...register("interest")} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none focus:ring-1 focus:ring-cyan-500" placeholder="e.g. Web Development, Gaming" />
                    {errors.interest && <p className="text-red-400 text-xs">{errors.interest.message}</p>}
                  </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-zinc-800 flex justify-between items-center mt-6">
             {step > 1 ? (
               <button type="button" onClick={prevStep} className="flex items-center gap-2 text-zinc-400 hover:text-white px-4 py-2 rounded text-sm transition-colors bg-zinc-800 hover:bg-zinc-700">
                 <ChevronLeft className="w-4 h-4" /> Back
               </button>
             ) : <div />}

             {step < 3 ? (
               <button type="button" onClick={nextStep} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded text-sm font-bold transition-colors">
                 Next <ChevronRight className="w-4 h-4" />
               </button>
             ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || uploading}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded text-sm font-bold uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {(isSubmitting || uploading) ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Wait
                    </>
                  ) : "Submit"}
                </button>
             )}
          </div>
          
          {step === 3 && (
            <div className="flex justify-center items-center gap-2 text-[10px] text-zinc-500 mt-4">
              <CheckCircle2 className="w-3 h-3 text-cyan-600" />
              You agree to the Community Guidelines
            </div>
          )}
        </form>
        
        <div className="mt-8 text-xs text-zinc-500 uppercase tracking-widest text-center border-t border-zinc-800/50 pt-6">
          Already applied and approved?{" "}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
            Login here
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}

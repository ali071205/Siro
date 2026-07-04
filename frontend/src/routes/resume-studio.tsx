import { apiFetch } from "../lib/api";
import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "../components/Layout";
import { Upload, Check, Loader2, Save } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/resume-studio")({
  component: ResumeStudioPage,
});

function ResumeStudioPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "", phone: "", email: "", skills: "", experience: "", education: "", links: ""
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append("resume", e.target.files[0]);

      try {
        const res = await apiFetch("/api/profile/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Failed to upload");
        
        const data = await res.json();
        
        if (data.status === "success" && data.profile) {
            setProfileData({
              name: data.profile.name || "",
              email: data.profile.email || "",
              phone: data.profile.phone || "",
              skills: data.profile.skills || "",
              experience: data.profile.experience || "",
              education: data.profile.education || "",
              links: data.profile.links || ""
            });
        }
        setIsUploading(false);
      } catch (err) {
        console.error(err);
        setIsUploading(false);
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-up">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <div className="text-[13px] font-mono text-neon-purple mb-1">Resume Studio</div>
            <h2 className="text-3xl font-bold tracking-tight">Master Profile Editor</h2>
          </div>
          <button className="h-11 px-6 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold inline-flex items-center gap-2 hover:scale-[1.02] transition glow-blue">
            <Save className="w-4 h-4" /> Save Profile
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="glass-strong rounded-2xl p-6 lg:col-span-1 h-fit">
            <h3 className="text-lg font-bold mb-4">Upload Master Resume</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Upload your original PDF or DOCX. Our parser will instantly extract your experience, skills, and contact details to generate the master profile.
            </p>
            
            <label className="relative flex flex-col items-center justify-center h-56 border-2 border-dashed border-white/20 rounded-xl hover:bg-white/5 hover:border-neon-cyan/50 transition cursor-pointer group overflow-hidden bg-black/20">
              <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleUpload} />
              
              {isUploading ? (
                <div className="flex flex-col items-center text-neon-cyan">
                  <Loader2 className="w-8 h-8 animate-spin mb-3" />
                  <span className="font-mono text-sm font-semibold text-glow-cyan">Parsing Document...</span>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center text-neon-green">
                  <Check className="w-8 h-8 mb-3 shadow-[0_0_12px_currentColor] rounded-full" />
                  <span className="font-mono text-sm font-semibold">Successfully Parsed</span>
                  <span className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">{file.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-muted-foreground group-hover:text-white transition">
                  <Upload className="w-8 h-8 mb-3 group-hover:text-neon-cyan transition" />
                  <span className="font-medium text-sm text-center px-4">Click or drag file to upload</span>
                  <span className="text-xs mt-2 font-mono text-white/40">PDF, DOCX up to 5MB</span>
                </div>
              )}
            </label>
          </div>

          {/* Editor Section */}
          <div className="glass-strong rounded-2xl p-6 lg:col-span-2">
            <h3 className="text-lg font-bold mb-6">Parsed Details</h3>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neon-cyan">Full Name</label>
                <input 
                  type="text" 
                  value={profileData.name} 
                  onChange={e => setProfileData({...profileData, name: e.target.value})}
                  className="w-full h-11 px-4 rounded-xl glass text-sm focus:outline-none focus:ring-2 focus:ring-neon-blue/50 transition bg-black/20" 
                  placeholder="e.g. Alex Chen"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neon-cyan">Email Address</label>
                <input 
                  type="email" 
                  value={profileData.email} 
                  onChange={e => setProfileData({...profileData, email: e.target.value})}
                  className="w-full h-11 px-4 rounded-xl glass text-sm focus:outline-none focus:ring-2 focus:ring-neon-blue/50 transition bg-black/20" 
                  placeholder="alex@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neon-cyan">Phone Number</label>
                <input 
                  type="tel" 
                  value={profileData.phone} 
                  onChange={e => setProfileData({...profileData, phone: e.target.value})}
                  className="w-full h-11 px-4 rounded-xl glass text-sm focus:outline-none focus:ring-2 focus:ring-neon-blue/50 transition bg-black/20" 
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neon-cyan">Links (LinkedIn, GitHub)</label>
                <input 
                  type="text" 
                  value={profileData.links} 
                  onChange={e => setProfileData({...profileData, links: e.target.value})}
                  className="w-full h-11 px-4 rounded-xl glass text-sm focus:outline-none focus:ring-2 focus:ring-neon-blue/50 transition bg-black/20" 
                  placeholder="linkedin.com/in/alex"
                />
              </div>
              
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-mono text-neon-purple">Core Skills (Comma separated)</label>
                <textarea 
                  value={profileData.skills} 
                  onChange={e => setProfileData({...profileData, skills: e.target.value})}
                  className="w-full min-h-[80px] p-4 rounded-xl glass text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition bg-black/20 resize-y" 
                  placeholder="React, TypeScript, Node.js..."
                />
              </div>
              
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-mono text-neon-purple">Professional Experience</label>
                <textarea 
                  value={profileData.experience} 
                  onChange={e => setProfileData({...profileData, experience: e.target.value})}
                  className="w-full min-h-[220px] p-4 rounded-xl glass text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition bg-black/20 resize-y font-mono leading-relaxed" 
                  placeholder="Company Name | Role | Dates..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

import { Zap, Database, Video, Palette, FileText, UserCircle, Archive, Settings } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-[#F8FAF9] text-slate-800 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* APP HEADER */}
        <header className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="bg-emerald-800 p-3 rounded-2xl shadow-xl shadow-emerald-900/20 group-hover:rotate-6 transition-transform">
              <Zap className="text-amber-400 w-8 h-8" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-emerald-900 leading-none">
                AI Content Factory <span className="text-amber-500">Pro</span>
              </h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">
                Video & Publishing Engine
              </p>
            </div>
          </div>
        </header>

        {/* HERO SECTION */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto mt-12 mb-20">
          <div className="bg-emerald-900 rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl shadow-emerald-950/40 border-4 border-emerald-800 text-center">
            <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-amber-400 rounded-full blur-[120px] opacity-20" />
            <div className="absolute bottom-[-20%] left-[-10%] w-96 h-96 bg-emerald-500 rounded-full blur-[120px] opacity-20" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/10 px-5 py-2 rounded-full border border-white/10 mb-8 backdrop-blur-md">
                <Video className="w-4 h-4 text-amber-400" fill="currentColor" />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-50">
                  Coming Soon - v1.0
                </span>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-black leading-tight mb-6 tracking-tighter italic">
                Video Rendering & <br/>
                <span className="text-amber-400 underline decoration-emerald-500 underline-offset-8">
                  Auto-Publish
                </span>
              </h2>
              
              <p className="text-emerald-100 text-lg md:text-xl mb-12 font-medium max-w-2xl mx-auto leading-relaxed">
                Convert your AI-generated storyboards to videos and publish directly to TikTok, YouTube, Instagram, and Twitter.
              </p>

              {/* FEATURES PREVIEW */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                <div className="bg-emerald-800/50 p-4 rounded-2xl border border-emerald-700/50">
                  <Video className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-emerald-100">Video Rendering</p>
                </div>
                <div className="bg-emerald-800/50 p-4 rounded-2xl border border-emerald-700/50">
                  <Palette className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-emerald-100">FFmpeg Integration</p>
                </div>
                <div className="bg-emerald-800/50 p-4 rounded-2xl border border-emerald-700/50">
                  <Database className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-emerald-100">Multi-Platform</p>
                </div>
                <div className="bg-emerald-800/50 p-4 rounded-2xl border border-emerald-700/50">
                  <Settings className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-emerald-100">Auto-Publish</p>
                </div>
              </div>

              <p className="text-emerald-300 text-sm font-medium">
                🚧 This section is under construction
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-20 py-10 border-t border-slate-200/60 max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 px-4">
          <div className="flex items-center gap-3 opacity-60">
            <Zap className="w-5 h-5 text-emerald-800" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              © 2026 AI Content Factory Pro
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App

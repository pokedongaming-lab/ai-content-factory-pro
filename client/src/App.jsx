import { useState } from 'react'
import { Zap, Database, Video, Palette, FileText, UserCircle, Archive, Settings, ArrowLeft } from 'lucide-react'
import VideoRenderer from './components/VideoRenderer'

function App() {
  const [currentView, setCurrentView] = useState('home')

  const renderContent = () => {
    switch(currentView) {
      case 'video-renderer':
        return <VideoRenderer />
      default:
        return <HomeView onNavigate={setCurrentView} />
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-slate-800 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6 bg-white border-b border-slate-100">
        <div className="flex items-center gap-4">
          {currentView !== 'home' && (
            <button 
              onClick={() => setCurrentView('home')}
              className="p-2 hover:bg-slate-100 rounded-xl transition"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
          )}
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setCurrentView('home')}>
            <div className="bg-emerald-800 p-2 rounded-xl shadow-lg">
              <Zap className="text-amber-400 w-6 h-6" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-xl font-black text-emerald-900">
                AI Content Factory <span className="text-amber-500">Pro</span>
              </h1>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex gap-2">
          <NavButton 
            icon={<Video className="w-4 h-4" />} 
            label="Video Render"
            active={currentView === 'video-renderer'}
            onClick={() => setCurrentView('video-renderer')}
          />
        </nav>
      </header>

      {/* Main Content */}
      {renderContent()}

      {/* Footer */}
      <footer className="mt-20 py-8 border-t border-slate-200/60 max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-center gap-3 opacity-60">
          <Zap className="w-4 h-4 text-emerald-800" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            © 2026 AI Content Factory Pro
          </span>
        </div>
      </footer>
    </div>
  )
}

function NavButton({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
        active 
          ? 'bg-emerald-800 text-amber-400' 
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function HomeView({ onNavigate }) {
  return (
    <div className="max-w-4xl mx-auto mt-12 mb-20 p-4">
      <div className="bg-emerald-900 rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl border-4 border-emerald-800 text-center">
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-amber-400 rounded-full blur-[120px] opacity-20" />
        <div className="absolute bottom-[-20%] left-[-10%] w-96 h-96 bg-emerald-500 rounded-full blur-[120px] opacity-20" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 px-5 py-2 rounded-full border border-white/10 mb-8 backdrop-blur-md">
            <Video className="w-4 h-4 text-amber-400" fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-50">
              v1.0 - Beta
            </span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-black leading-tight mb-6 tracking-tighter italic">
            Video Rendering & <br/>
            <span className="text-amber-400 underline decoration-emerald-500 underline-offset-8">
              Auto-Publish
            </span>
          </h2>
          
          <p className="text-emerald-100 text-lg mb-12 font-medium max-w-2xl mx-auto">
            Convert your AI-generated storyboards to videos and publish directly to TikTok, YouTube, Instagram, and Twitter.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <FeatureCard 
              icon={<Video className="w-8 h-8" />}
              title="Video Rendering"
              available
              onClick={() => onNavigate('video-renderer')}
            />
            <FeatureCard 
              icon={<Palette className="w-8 h-8" />}
              title="FFmpeg"
              subtitle="Processing"
              comingSoon
            />
            <FeatureCard 
              icon={<Database className="w-8 h-8" />}
              title="Multi-Platform"
              subtitle="Publishing"
              comingSoon
            />
            <FeatureCard 
              icon={<Settings className="w-8 h-8" />}
              title="Analytics"
              subtitle="Dashboard"
              comingSoon
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, subtitle, available, comingSoon, onClick }) {
  const content = (
    <div className={`bg-emerald-800/50 p-4 rounded-2xl border border-emerald-700/50 transition hover:scale-105 ${available ? 'cursor-pointer hover:bg-emerald-700/50' : ''}`}>
      <div className="text-amber-400 mb-2 flex justify-center">{icon}</div>
      <p className="text-xs font-bold text-emerald-100">{title}</p>
      {subtitle && <p className="text-[10px] text-emerald-300">{subtitle}</p>}
      {comingSoon && (
        <span className="text-[8px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded mt-1 inline-block">
          Coming Soon
        </span>
      )}
      {available && (
        <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded mt-1 inline-block">
          Available
        </span>
      )}
    </div>
  )

  if (available && onClick) {
    return <button onClick={onClick} className="text-left">{content}</button>
  }

  return content
}

export default App

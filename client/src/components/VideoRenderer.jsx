import { useState, useEffect, useRef } from 'react'
import { 
  Video, Upload, Play, Pause, Download, 
  Loader2, CheckCircle2, X, Image, Music,
  Mic, Settings, RotateCcw, AlertCircle
} from 'lucide-react'

const API_URL = '/api'

export default function VideoRenderer() {
  const [frames, setFrames] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [jobId, setJobId] = useState(null)
  const [jobStatus, setJobStatus] = useState(null)
  const [renderedVideo, setRenderedVideo] = useState(null)
  const [settings, setSettings] = useState({
    quality: '1080p',
    transition: 'crossfade',
    duration: 4
  })
  const [audioSettings, setAudioSettings] = useState({
    backgroundMusic: null,
    voiceOver: null
  })
  const [error, setError] = useState(null)
  
  const videoRef = useRef(null)
  const pollIntervalRef = useRef(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  // Poll job status
  useEffect(() => {
    if (jobId && jobStatus === 'processing') {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const response = await fetch(`${API_URL}/video/status/${jobId}`)
          const data = await response.json()
          
          setJobStatus(data.status)
          
          if (data.status === 'completed') {
            clearInterval(pollIntervalRef.current)
            // Auto fetch rendered video
            const videoResponse = await fetch(`${API_URL}/video/download/${jobId}`)
            const videoData = await videoResponse.json()
            setRenderedVideo(videoData.video)
          } else if (data.status === 'failed') {
            clearInterval(pollIntervalRef.current)
            setError(data.error || 'Video rendering failed')
          }
        } catch (err) {
          console.error('Poll error:', err)
        }
      }, 2000)
    }
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [jobId, jobStatus])

  const handleFrameUpload = (e) => {
    const files = Array.from(e.target.files)
    const newFrames = files.map((file, index) => ({
      id: Date.now() + index,
      file,
      preview: URL.createObjectURL(file),
      startImage: null,
      endImage: null
    }))
    setFrames(prev => [...prev, ...newFrames])
  }

  const handleStartImage = (frameId, imageData) => {
    setFrames(prev => prev.map(f => 
      f.id === frameId ? { ...f, startImage: imageData } : f
    ))
  }

  const handleEndImage = (frameId, imageData) => {
    setFrames(prev => prev.map(f => 
      f.id === frameId ? { ...f, endImage: imageData } : f
    ))
  }

  const removeFrame = (frameId) => {
    setFrames(prev => prev.filter(f => f.id !== frameId))
  }

  const handleBackgroundMusic = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setAudioSettings(prev => ({ ...prev, backgroundMusic: e.target.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVoiceOver = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setAudioSettings(prev => ({ ...prev, voiceOver: e.target.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const startRendering = async () => {
    if (frames.length === 0) {
      setError('Please add at least one frame')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Convert frames to proper format
      const frameData = frames.map(f => ({
        startImage: f.startImage || f.preview,
        endImage: f.endImage || f.preview,
        duration: settings.duration
      }))

      const response = await fetch(`${API_URL}/video/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frames: frameData,
          audio: audioSettings,
          settings
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start rendering')
      }

      setJobId(data.jobId)
      setJobStatus('processing')
    } catch (err) {
      setError(err.message)
      setIsProcessing(false)
    }
  }

  const downloadVideo = () => {
    if (renderedVideo) {
      const link = document.createElement('a')
      link.href = renderedVideo
      link.download = 'ai-content-video.mp4'
      link.click()
    }
  }

  const resetAll = () => {
    setFrames([])
    setJobId(null)
    setJobStatus(null)
    setRenderedVideo(null)
    setAudioSettings({ backgroundMusic: null, voiceOver: null })
    setError(null)
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-800 p-3 rounded-2xl shadow-xl">
              <Video className="text-amber-400 w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-emerald-900">Video Renderer</h1>
              <p className="text-slate-400 text-sm">Convert frames to MP4 video</p>
            </div>
          </div>
          <button 
            onClick={resetAll}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Frames */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Upload Frames */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="font-black text-emerald-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Image className="w-5 h-5" />
                Frames
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {frames.map((frame, index) => (
                  <div key={frame.id} className="relative group bg-slate-50 rounded-2xl p-2">
                    <button 
                      onClick={() => removeFrame(frame.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition z-10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="aspect-[9/16] bg-slate-200 rounded-xl overflow-hidden">
                      {frame.preview ? (
                        <img src={frame.preview} alt={`Frame ${index + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Image className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <p className="text-center text-xs font-bold text-slate-500 mt-2">
                      Scene {index + 1}
                    </p>
                  </div>
                ))}
                
                {/* Add Frame Button */}
                <label className="aspect-[9/16] bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-bold text-slate-500">Add Frame</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={handleFrameUpload}
                    className="hidden" 
                  />
                </label>
              </div>
            </div>

            {/* Audio Settings */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="font-black text-emerald-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Music className="w-5 h-5" />
                Audio
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Background Music */}
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-slate-500 mb-2">Background Music</p>
                  {audioSettings.backgroundMusic ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-emerald-700">Music added</span>
                      <button 
                        onClick={() => setAudioSettings(prev => ({ ...prev, backgroundMusic: null }))}
                        className="ml-auto text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">Upload MP3</span>
                      <input 
                        type="file" 
                        accept="audio/*" 
                        onChange={handleBackgroundMusic}
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>

                {/* Voice Over */}
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-slate-500 mb-2">Voice Over</p>
                  {audioSettings.voiceOver ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-emerald-700">Voice added</span>
                      <button 
                        onClick={() => setAudioSettings(prev => ({ ...prev, voiceOver: null }))}
                        className="ml-auto text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                      <Mic className="w-4 h-4" />
                      <span className="text-sm">Upload Audio</span>
                      <input 
                        type="file" 
                        accept="audio/*" 
                        onChange={handleVoiceOver}
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Settings & Preview */}
          <div className="space-y-6">
            
            {/* Settings */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="font-black text-emerald-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Settings
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-2">Quality</label>
                  <select 
                    value={settings.quality}
                    onChange={(e) => setSettings(prev => ({ ...prev, quality: e.target.value }))}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="720p">720p (HD)</option>
                    <option value="1080p">1080p (Full HD)</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-2">Transition</label>
                  <select 
                    value={settings.transition}
                    onChange={(e) => setSettings(prev => ({ ...prev, transition: e.target.value }))}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="fade">Fade</option>
                    <option value="crossfade">Crossfade</option>
                    <option value="none">None (Hard Cut)</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-2">Duration per Scene (sec)</label>
                  <select 
                    value={settings.duration}
                    onChange={(e) => setSettings(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value={4}>4 seconds</option>
                    <option value={6}>6 seconds</option>
                    <option value={8}>8 seconds</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Render Button */}
            <button
              onClick={startRendering}
              disabled={isProcessing || frames.length === 0}
              className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl transition flex items-center justify-center gap-3 ${
                isProcessing || frames.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-800 text-amber-400 hover:bg-emerald-900'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Rendering...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Render Video
                </>
              )}
            </button>

            {/* Progress */}
            {jobStatus && jobStatus === 'processing' && (
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-emerald-800">Processing...</span>
                  <span className="text-sm font-bold text-emerald-600">{jobStatus?.progress || 0}%</span>
                </div>
                <div className="w-full bg-emerald-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full transition-all"
                    style={{ width: `${jobStatus?.progress || 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Preview & Download */}
            {renderedVideo && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="font-black text-emerald-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Preview
                </h2>
                
                <video 
                  ref={videoRef}
                  src={renderedVideo} 
                  controls 
                  className="w-full rounded-xl mb-4"
                />
                
                <button
                  onClick={downloadVideo}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition"
                >
                  <Download className="w-5 h-5" />
                  Download MP4
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

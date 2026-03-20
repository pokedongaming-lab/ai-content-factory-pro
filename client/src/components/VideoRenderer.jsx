import { useState, useEffect, useRef } from 'react'
import { 
  Video, Upload, Play, Pause, Download, 
  Loader2, CheckCircle2, X, Image, Music,
  Mic, Settings, RotateCcw, AlertCircle, Sparkles
} from 'lucide-react'

const API_URL = '/api'

export default function VideoRenderer() {
  const [frames, setFrames] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [jobId, setJobId] = useState(null)
  const [jobStatus, setJobStatus] = useState(null)
  const [renderedVideo, setRenderedVideo] = useState(null)
  const [useAIVideo, setUseAIVideo] = useState(false)
  const [aiJobId, setAiJobId] = useState(null)
  const [aiJobStatus, setAiJobStatus] = useState(null)
  const [aiVideoUrl, setAiVideoUrl] = useState(null)
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
  const [aiPrompt, setAiPrompt] = useState('')
  
  const videoRef = useRef(null)
  const pollIntervalRef = useRef(null)
  const aiPollIntervalRef = useRef(null)

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      if (aiPollIntervalRef.current) clearInterval(aiPollIntervalRef.current)
    }
  }, [])

  // Poll FFmpeg job status
  useEffect(() => {
    if (jobId && jobStatus === 'processing') {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const response = await fetch(`${API_URL}/video/status/${jobId}`)
          const data = await response.json()
          setJobStatus(data.status)
          if (data.status === 'completed') {
            clearInterval(pollIntervalRef.current)
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
      }, 3000)
    }
    return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current) }
  }, [jobId, jobStatus])

  // Poll AI video job status
  useEffect(() => {
    if (aiJobId && aiJobStatus === 'processing') {
      aiPollIntervalRef.current = setInterval(async () => {
        try {
          const response = await fetch(`${API_URL}/ai-video/status/${aiJobId}`)
          const data = await response.json()
          setAiJobStatus(data.status)
          if (data.status === 'completed') {
            clearInterval(aiPollIntervalRef.current)
            setAiVideoUrl(data.videoUrl)
          } else if (data.status === 'failed') {
            clearInterval(aiPollIntervalRef.current)
            setError(data.error || 'AI video generation failed')
          }
        } catch (err) {
          console.error('AI Poll error:', err)
        }
      }, 5000)
    }
    return () => { if (aiPollIntervalRef.current) clearInterval(aiPollIntervalRef.current) }
  }, [aiJobId, aiJobStatus])

  const handleFrameUpload = (e) => {
    const files = Array.from(e.target.files)
    const promises = files.map((file, index) => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          resolve({
            id: Date.now() + index,
            file,
            preview: e.target.result,
            startImage: e.target.result,
            endImage: e.target.result
          })
        }
        reader.readAsDataURL(file)
      })
    })
    Promise.all(promises).then(newFrames => {
      setFrames(prev => [...prev, ...newFrames])
    })
  }

  const removeFrame = (frameId) => {
    setFrames(prev => prev.filter(f => f.id !== frameId))
  }

  const startFFmpegRendering = async () => {
    if (frames.length === 0) {
      setError('Please add at least one frame')
      return
    }
    setIsProcessing(true)
    setError(null)
    try {
      const frameData = frames.map(f => ({
        startImage: f.startImage,
        endImage: f.endImage,
        duration: settings.duration
      }))
      const response = await fetch(`${API_URL}/video/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frames: frameData, audio: audioSettings, settings })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to start rendering')
      setJobId(data.jobId)
      setJobStatus('processing')
    } catch (err) {
      setError(err.message)
      setIsProcessing(false)
    }
  }

  const generateAIVideo = async () => {
    if (frames.length === 0) {
      setError('Please add at least one image')
      return
    }
    setIsProcessing(true)
    setError(null)
    try {
      // Use first frame for AI video generation
      const imageUrl = frames[0].preview
      const response = await fetch(`${API_URL}/ai-video/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, prompt: aiPrompt })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to start AI generation')
      setAiJobId(data.jobId)
      setAiJobStatus('processing')
    } catch (err) {
      setError(err.message)
      setIsProcessing(false)
    }
  }

  const resetAll = () => {
    setFrames([])
    setJobId(null)
    setJobStatus(null)
    setRenderedVideo(null)
    setAiJobId(null)
    setAiJobStatus(null)
    setAiVideoUrl(null)
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
          <button onClick={resetAll} className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="bg-white p-4 rounded-2xl mb-6 border border-slate-100">
          <div className="flex gap-4">
            <button
              onClick={() => setUseAIVideo(false)}
              className={`flex-1 py-3 px-6 rounded-xl font-bold transition ${!useAIVideo ? 'bg-emerald-800 text-amber-400' : 'bg-slate-100 text-slate-600'}`}
            >
              📺 FFmpeg (Slideshow)
            </button>
            <button
              onClick={() => setUseAIVideo(true)}
              className={`flex-1 py-3 px-6 rounded-xl font-bold transition ${useAIVideo ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              ✨ AI Video (Pika)
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left - Upload */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="font-black text-emerald-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Image className="w-5 h-5" />
                {useAIVideo ? 'AI Image (First image will be used)' : 'Frames'}
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {frames.map((frame, index) => (
                  <div key={frame.id} className="relative group bg-slate-50 rounded-2xl p-2">
                    <button onClick={() => removeFrame(frame.id)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 z-10">
                      <X className="w-3 h-3" />
                    </button>
                    <div className="aspect-[9/16] bg-slate-200 rounded-xl overflow-hidden">
                      {frame.preview && <img src={frame.preview} alt={`Frame ${index + 1}`} className="w-full h-full object-cover" />}
                    </div>
                    <p className="text-center text-xs font-bold text-slate-500 mt-2">Scene {index + 1}</p>
                  </div>
                ))}
                <label className="aspect-[9/16] bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-bold text-slate-500">Add Image</span>
                  <input type="file" accept="image/*" multiple onChange={handleFrameUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* AI Prompt (only show when AI mode is on) */}
            {useAIVideo && (
              <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100">
                <h2 className="font-black text-purple-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  AI Prompt (Optional)
                </h2>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe what you want the video to look like..."
                  className="w-full p-4 border border-purple-200 rounded-xl text-sm"
                  rows={3}
                />
                <p className="text-xs text-purple-600 mt-2">Example: "Make it move smoothly, zoom in slowly"</p>
              </div>
            )}
          </div>

          {/* Right - Settings & Render */}
          <div className="space-y-6">
            {!useAIVideo && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="font-black text-emerald-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" /> Settings
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-2">Quality</label>
                    <select value={settings.quality} onChange={(e) => setSettings(prev => ({ ...prev, quality: e.target.value }))} className="w-full p-3 border border-slate-200 rounded-xl text-sm">
                      <option value="720p">720p (HD)</option>
                      <option value="1080p">1080p (Full HD)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-2">Duration per Scene</label>
                    <select value={settings.duration} onChange={(e) => setSettings(prev => ({ ...prev, duration: parseInt(e.target.value) }))} className="w-full p-3 border border-slate-200 rounded-xl text-sm">
                      <option value={4}>4 seconds</option>
                      <option value={6}>6 seconds</option>
                      <option value={8}>8 seconds</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Render Button */}
            {useAIVideo ? (
              <button
                onClick={generateAIVideo}
                disabled={isProcessing || frames.length === 0}
                className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl transition flex items-center justify-center gap-3 ${isProcessing || frames.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {isProcessing ? 'Generating AI Video...' : 'Generate AI Video'}
              </button>
            ) : (
              <button
                onClick={startFFmpegRendering}
                disabled={isProcessing || frames.length === 0}
                className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl transition flex items-center justify-center gap-3 ${isProcessing || frames.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-800 text-amber-400 hover:bg-emerald-900'}`}
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                {isProcessing ? 'Rendering...' : 'Render Video'}
              </button>
            )}

            {/* Progress */}
            {(jobStatus === 'processing' || aiJobStatus === 'processing') && (
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-emerald-800">
                    {aiJobStatus === 'processing' ? '🤖 AI Generating...' : '⚙️ Processing...'}
                  </span>
                  <span className="text-sm font-bold text-emerald-600">{(aiJobStatus === 'processing' ? aiJobStatus?.progress : jobStatus?.progress) || 0}%</span>
                </div>
                <div className="w-full bg-emerald-200 rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full transition-all" style={{ width: `${(aiJobStatus === 'processing' ? aiJobStatus?.progress : jobStatus?.progress) || 0}%` }} />
                </div>
              </div>
            )}

            {/* FFmpeg Preview & Download */}
            {renderedVideo && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="font-black text-emerald-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Play className="w-5 h-5" /> Preview
                </h2>
                <video ref={videoRef} src={renderedVideo} controls className="w-full rounded-xl mb-4" />
                <button onClick={() => { const link = document.createElement('a'); link.href = renderedVideo; link.download = 'ai-content-video.mp4'; link.click(); }} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700">
                  <Download className="w-5 h-5" /> Download MP4
                </button>
              </div>
            )}

            {/* AI Video Preview */}
            {aiVideoUrl && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="font-black text-purple-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> AI Video Ready!
                </h2>
                <video src={aiVideoUrl} controls className="w-full rounded-xl mb-4" />
                <a href={aiVideoUrl} target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-700">
                  <Download className="w-5 h-5" /> Open Video
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

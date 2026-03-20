import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Temporary directory for processing
const TEMP_DIR = path.join(__dirname, '../../temp')
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
}

// In-memory job storage (use database in production)
const videoJobs = new Map()

/**
 * Create a video from frames with transitions
 * @param {Object} options - Video generation options
 * @param {Array} options.frames - Array of {startImage, endImage, duration}
 * @param {Object} options.audio - { backgroundMusic: base64, voiceOver: base64 }
 * @param {Object} options.settings - { quality: '720p'|'1080p', transition: 'fade'|'crossfade' }
 * @returns {Promise<Object>} - Job result
 */
export async function createVideoJob({ frames, audio, settings }) {
  const jobId = `video_${uuidv4()}`
  const jobDir = path.join(TEMP_DIR, jobId)
  
  fs.mkdirSync(jobDir, { recursive: true })
  
  const job = {
    id: jobId,
    status: 'processing',
    progress: 0,
    createdAt: new Date().toISOString(),
    frames: frames.length,
    settings
  }
  
  videoJobs.set(jobId, job)
  
  // Start processing in background
  processVideo(jobId, jobDir, { frames, audio, settings })
    .then(outputPath => {
      const completedJob = videoJobs.get(jobId)
      completedJob.status = 'completed'
      completedJob.progress = 100
      completedJob.outputPath = outputPath
      completedJob.completedAt = new Date().toISOString()
    })
    .catch(error => {
      const failedJob = videoJobs.get(jobId)
      failedJob.status = 'failed'
      failedJob.error = error.message
    })
  
  return job
}

/**
 * Process video with FFmpeg
 */
async function processVideo(jobId, jobDir, { frames, audio, settings }) {
  const { quality = '1080p', transition = 'crossfade' } = settings
  
  // Resolution mapping
  const resolutions = {
    '720p': { width: 720, height: 1280 },
    '1080p': { width: 1080, height: 1920 }
  }
  
  const { width, height } = resolutions[quality] || resolutions['1080p']
  
  // Save frame images
  const framePaths = []
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i]
    
    // Validate frame has at least one image
    if (!frame.startImage && !frame.endImage) {
      console.warn(`Frame ${i} has no images, skipping...`)
      continue
    }
    
    const startPath = path.join(jobDir, `frame_${i}_start.jpg`)
    const endPath = path.join(jobDir, `frame_${i}_end.jpg`)
    
    // Decode base64 and save - handle both with and without data URL prefix
    try {
      if (frame.startImage) {
        const startData = frame.startImage.includes(',') ? frame.startImage.split(',')[1] : frame.startImage
        const startBuffer = Buffer.from(startData, 'base64')
        fs.writeFileSync(startPath, startBuffer)
      }
      if (frame.endImage) {
        const endData = frame.endImage.includes(',') ? frame.endImage.split(',')[1] : frame.endImage
        const endBuffer = Buffer.from(endData, 'base64')
        fs.writeFileSync(endPath, endBuffer)
      }
    } catch (imgError) {
      console.error(`Error processing frame ${i}:`, imgError)
    }
    
    framePaths.push({ start: startPath, end: endPath, duration: frame.duration || 4 })
  }
  
  if (framePaths.length === 0) {
    throw new Error('No valid frames to process')
  }
  
  // Update progress
  let job = videoJobs.get(jobId)
  job.progress = 20
  
  // Create concat file for FFmpeg
  const concatFilePath = path.join(jobDir, 'input.txt')
  let concatContent = ''
  
  for (let i = 0; i < framePaths.length; i++) {
    const fp = framePaths[i]
    // Only add if file exists
    if (fs.existsSync(fp.start)) {
      concatContent += `file '${fp.start.replace(/\\/g, '/')}'\nduration ${fp.duration}\n`
    }
    if (i === framePaths.length - 1 && fs.existsSync(fp.end)) {
      concatContent += `file '${fp.end.replace(/\\/g, '/')}'\n`
    }
  }
  
  if (!concatContent) {
    throw new Error('No valid frame files to process')
  }
  
  fs.writeFileSync(concatFilePath, concatContent)
  
  const outputPath = path.join(jobDir, 'output.mp4')
  
  return new Promise((resolve, reject) => {
    let command = ffmpeg()
      .input(concatFilePath)
      .inputFormat('concat')
      .inputFPS(1)
      .size(`${width}x${height}`)
      .videoCodec('libx264')
      .videoBitrate('5000k')
      .outputOptions([
        '-pix_fmt yuv420p',
        '-preset fast',
        '-crf 23'
      ])
    
    // Add background music if provided
    if (audio && audio.backgroundMusic) {
      try {
        const musicData = audio.backgroundMusic.includes(',') ? audio.backgroundMusic.split(',')[1] : audio.backgroundMusic
        const musicPath = path.join(jobDir, 'music.mp3')
        const musicBuffer = Buffer.from(musicData, 'base64')
        fs.writeFileSync(musicPath, musicBuffer)
        
        command = command
          .input(musicPath)
          .complexFilter([
            '[1:a]volume=0.3[music]',
            '[0:a][music]amix=inputs=2:duration=first[aout]'
          ])
          .outputOptions(['-map 0:v', '-map [aout]'])
      } catch (e) {
        console.warn('Failed to add background music:', e)
      }
    }
    
    // Add voice over if provided
    if (audio && audio.voiceOver) {
      try {
        const voiceData = audio.voiceOver.includes(',') ? audio.voiceOver.split(',')[1] : audio.voiceOver
        const voicePath = path.join(jobDir, 'voice.mp3')
        const voiceBuffer = Buffer.from(voiceData, 'base64')
        fs.writeFileSync(voicePath, voiceBuffer)
        
        command = command
          .input(voicePath)
      } catch (e) {
        console.warn('Failed to add voice over:', e)
      }
    }
    
    command
      .output(outputPath)
      .on('progress', (progress) => {
        job = videoJobs.get(jobId)
        job.progress = Math.min(80, 20 + Math.round(progress.percent || 0))
      })
      .on('end', () => {
        job = videoJobs.get(jobId)
        job.progress = 100
        resolve(outputPath)
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err)
        reject(err)
      })
      .run()
  })
}

/**
 * Get job status
 */
export function getJobStatus(jobId) {
  return videoJobs.get(jobId) || null
}

/**
 * Get video file as base64
 */
export async function getVideoFile(jobId) {
  const job = videoJobs.get(jobId)
  if (!job || job.status !== 'completed') {
    throw new Error('Video not ready')
  }
  
  const videoBuffer = fs.readFileSync(job.outputPath)
  return `data:video/mp4;base64,${videoBuffer.toString('base64')}`
}

export default {
  createVideoJob,
  getJobStatus,
  getVideoFile
}

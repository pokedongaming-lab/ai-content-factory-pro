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
    const startPath = path.join(jobDir, `frame_${i}_start.jpg`)
    const endPath = path.join(jobDir, `frame_${i}_end.jpg`)
    
    // Decode base64 and save
    if (frame.startImage) {
      const startBuffer = Buffer.from(frame.startImage.split(',')[1], 'base64')
      fs.writeFileSync(startPath, startBuffer)
    }
    if (frame.endImage) {
      const endBuffer = Buffer.from(frame.endImage.split(',')[1], 'base64')
      fs.writeFileSync(endPath, endBuffer)
    }
    
    framePaths.push({ start: startPath, end: endPath, duration: frame.duration || 4 })
  }
  
  // Update progress
  let job = videoJobs.get(jobId)
  job.progress = 20
  
  // Create concat file for FFmpeg
  const concatFilePath = path.join(jobDir, 'input.txt')
  let concatContent = ''
  
  for (let i = 0; i < framePaths.length; i++) {
    const fp = framePaths[i]
    concatContent += `file '${fp.start}'\nduration ${fp.duration}\n`
    if (i === framePaths.length - 1) {
      concatContent += `file '${fp.end}'\n`
    }
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
      const musicPath = path.join(jobDir, 'music.mp3')
      const musicBuffer = Buffer.from(audio.backgroundMusic.split(',')[1], 'base64')
      fs.writeFileSync(musicPath, musicBuffer)
      
      command = command
        .input(musicPath)
        .complexFilter([
          '[1:a]volume=0.3[music]',
          '[0:a][music]amix=inputs=2:duration=first[aout]'
        ])
        .outputOptions(['-map 0:v', '-map [aout]'])
    }
    
    // Add voice over if provided
    if (audio && audio.voiceOver) {
      const voicePath = path.join(jobDir, 'voice.mp3')
      const voiceBuffer = Buffer.from(audio.voiceOver.split(',')[1], 'base64')
      fs.writeFileSync(voicePath, voiceBuffer)
      
      command = command
        .input(voicePath)
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

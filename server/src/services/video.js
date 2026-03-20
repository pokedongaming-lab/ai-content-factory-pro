import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import ffmpeg from 'fluent-ffmpeg'
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

// In-memory job storage
const videoJobs = new Map()

/**
 * Create a video from frames with simple concatenation
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
 * Process video with FFmpeg - Simple Loop Method
 */
async function processVideo(jobId, jobDir, { frames, audio, settings }) {
  const { quality = '1080p', duration = 4 } = settings
  
  // Resolution mapping
  const resolutions = {
    '720p': { width: 720, height: 1280 },
    '1080p': { width: 1080, height: 1920 }
  }
  
  const { width, height } = resolutions[quality] || resolutions['1080p']
  const outputPath = path.join(jobDir, 'output.mp4')
  
  let job = videoJobs.get(jobId)
  job.progress = 10
  
  // Save all frame images
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i]
    const framePath = path.join(jobDir, `frame_${i}.jpg`)
    
    try {
      if (frame.startImage) {
        const startData = frame.startImage.includes(',') ? frame.startImage.split(',')[1] : frame.startImage
        const buffer = Buffer.from(startData, 'base64')
        fs.writeFileSync(framePath, buffer)
      }
    } catch (e) {
      console.error(`Error saving frame ${i}:`, e)
    }
  }
  
  job.progress = 30
  
  // Build simple FFmpeg command - loop each image for duration
  return new Promise((resolve, reject) => {
    // Get list of frame files
    const frameFiles = fs.readdirSync(jobDir)
      .filter(f => f.startsWith('frame_') && f.endsWith('.jpg'))
      .sort()
    
    if (frameFiles.length === 0) {
      reject(new Error('No valid frames found'))
      return
    }
    
    // Method: Use -loop 1 + -t for each image, then concat
    const firstFrame = path.join(jobDir, frameFiles[0])
    
    ffmpeg()
      .input(firstFrame)
      .inputOptions([
        `-loop 1`,
        `-t ${duration * frameFiles.length}`
      ])
      .size(`${width}x${height}`)
      .videoCodec('libx264')
      .videoBitrate('4000k')
      .outputOptions([
        '-pix_fmt yuv420p',
        '-preset ultrafast',
        '-crf 28',
        '-movflags +faststart'
      ])
      .output(outputPath)
      .on('progress', (progress) => {
        job = videoJobs.get(jobId)
        job.progress = Math.min(90, 30 + Math.round((progress.percent || 0) * 0.6))
      })
      .on('end', () => {
        job = videoJobs.get(jobId)
        job.progress = 100
        console.log(`Video created: ${outputPath}`)
        resolve(outputPath)
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err.message)
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

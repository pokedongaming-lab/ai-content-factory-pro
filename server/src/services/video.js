import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { execSync, spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'

const ffmpegPath = ffmpegInstaller.path

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
 * Create a video from frames - using direct exec
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
 * Process video using direct exec - much more reliable
 */
async function processVideo(jobId, jobDir, { frames, settings }) {
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
  
  // Get list of frame files
  const frameFiles = fs.readdirSync(jobDir)
    .filter(f => f.startsWith('frame_') && f.endsWith('.jpg'))
    .sort()
  
  if (frameFiles.length === 0) {
    throw new Error('No valid frames found')
  }
  
  // Create a simple slideshow video - loop each image for duration seconds
  const inputPattern = path.join(jobDir, 'frame_%d.jpg')
  const totalDuration = duration * frameFiles.length
  
  job.progress = 50
  
  // Use direct exec for more reliable execution
  const cmd = [
    `"${ffmpegPath}"`,
    '-framerate 1/' + duration,
    `-i "${inputPattern}"`,
    `-vf "scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1"`,
    '-c:v libx264',
    '-pix_fmt yuv420p',
    '-preset ultrafast',
    '-crf 28',
    `-t ${totalDuration}`,
    `-y`,
    `"${outputPath}"`
  ].join(' ')
  
  console.log('Running FFmpeg command:', cmd)
  
  return new Promise((resolve, reject) => {
    try {
      const output = execSync(cmd, {
        encoding: 'utf8',
        timeout: 120000, // 2 minute timeout
        cwd: jobDir
      })
      
      console.log('FFmpeg output:', output)
      
      job = videoJobs.get(jobId)
      job.progress = 100
      
      if (fs.existsSync(outputPath)) {
        resolve(outputPath)
      } else {
        reject(new Error('Output video not created'))
      }
    } catch (error) {
      console.error('FFmpeg error:', error.message)
      reject(error)
    }
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

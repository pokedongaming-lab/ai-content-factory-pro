import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { execSync } from 'child_process'
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
 * Create a video from frames
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
 * Convert base64 image to proper JPEG using FFmpeg
 */
function convertToProperJPEG(jobDir, inputData, inputName) {
  const inputPath = path.join(jobDir, inputName)
  const outputPath = path.join(jobDir, inputName.replace('.jpg', '_converted.jpg'))
  
  // Save the raw base64 data first
  try {
    const base64Data = inputData.includes(',') ? inputData.split(',')[1] : inputData
    const buffer = Buffer.from(base64Data, 'base64')
    fs.writeFileSync(inputPath, buffer)
  } catch (e) {
    console.error('Error saving base64 to file:', e)
    throw new Error('Failed to decode image data')
  }
  
  // Use FFmpeg to convert/validate the image
  const cmd = [
    `"${ffmpegPath}"`,
    `-i "${inputPath}"`,
    `-y`,
    `-c:v mjpeg`,
    `-q:v 2`,
    `"${outputPath}"`
  ].join(' ')
  
  try {
    execSync(cmd, { encoding: 'utf8', timeout: 30000 })
    // Remove original, use converted
    fs.unlinkSync(inputPath)
    return outputPath
  } catch (e) {
    console.error('FFmpeg convert error:', e.message)
    // If conversion fails, just try to use the original
    return inputPath
  }
}

/**
 * Process video using direct exec
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
  
  // Save and convert all frame images to proper JPEG
  const convertedFrames = []
  
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i]
    
    if (frame.startImage) {
      try {
        const convertedPath = convertToProperJPEG(jobDir, frame.startImage, `frame_${i}.jpg`)
        convertedFrames.push(convertedPath)
        console.log(`Frame ${i} converted successfully`)
      } catch (e) {
        console.error(`Error converting frame ${i}:`, e)
      }
    }
  }
  
  job.progress = 40
  
  if (convertedFrames.length === 0) {
    throw new Error('No valid frames found after conversion')
  }
  
  // Create a simple concat demuxer file
  const concatFilePath = path.join(jobDir, 'input.txt')
  let concatContent = ''
  
  for (let i = 0; i < convertedFrames.length; i++) {
    const fp = convertedFrames[i].replace(/\\/g, '/')
    concatContent += `file '${fp}'\nduration ${duration}\n`
  }
  
  // Add last frame again to fill the duration
  if (convertedFrames.length > 0) {
    const lastFrame = convertedFrames[convertedFrames.length - 1].replace(/\\/g, '/')
    concatContent += `file '${lastFrame}'\n`
  }
  
  fs.writeFileSync(concatFilePath, concatContent)
  
  job.progress = 60
  
  // Use concat demuxer to create video
  const cmd = [
    `"${ffmpegPath}"`,
    `-f concat`,
    `-safe 0`,
    `-i "${concatFilePath}"`,
    `-vf "scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1"`,
    `-c:v libx264`,
    `-pix_fmt yuv420p`,
    `-preset ultrafast`,
    `-crf 28`,
    `-y`,
    `"${outputPath}"`
  ].join(' ')
  
  console.log('Running FFmpeg command:', cmd)
  
  return new Promise((resolve, reject) => {
    try {
      const output = execSync(cmd, {
        encoding: 'utf8',
        timeout: 180000,
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

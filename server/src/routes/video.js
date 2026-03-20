import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import videoService from '../services/video.js'

const router = express.Router()

// Configure multer for file uploads
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadDir = path.join(__dirname, '../../../temp/uploads')

import fs from 'fs'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`
    cb(null, uniqueName)
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
})

// POST /api/video/render - Create video rendering job
router.post('/render', async (req, res) => {
  try {
    const { frames, audio, settings } = req.body
    
    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return res.status(400).json({ error: 'Frames array is required' })
    }
    
    const job = await videoService.createVideoJob({
      frames,
      audio: audio || {},
      settings: settings || { quality: '1080p', transition: 'crossfade' }
    })
    
    res.json({
      success: true,
      jobId: job.id,
      status: job.status,
      message: 'Video rendering job created'
    })
  } catch (error) {
    console.error('Video render error:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/video/status/:jobId - Check rendering status
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params
    
    const job = videoService.getJobStatus(jobId)
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }
    
    res.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      error: job.error
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/video/download/:jobId - Download rendered video
router.get('/download/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params
    
    const job = videoService.getJobStatus(jobId)
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }
    
    if (job.status !== 'completed') {
      return res.status(400).json({ 
        error: 'Video not ready',
        status: job.status,
        progress: job.progress
      })
    }
    
    const videoBase64 = await videoService.getVideoFile(jobId)
    
    // Return as base64
    res.json({
      success: true,
      video: videoBase64,
      filename: `video_${jobId}.mp4`
    })
  } catch (error) {
    console.error('Video download error:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/video/render/file - Upload frames as files (alternative method)
router.post('/render/file', upload.array('frames', 20), async (req, res) => {
  try {
    const files = req.files
    const { audio, settings } = req.body
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No frames uploaded' })
    }
    
    // Convert uploaded files to base64
    const frames = files.map(file => ({
      startImage: `data:image/jpeg;base64,${file.buffer.toString('base64')}`,
      duration: 4
    }))
    
    const job = await videoService.createVideoJob({
      frames,
      audio: audio ? JSON.parse(audio) : {},
      settings: settings ? JSON.parse(settings) : { quality: '1080p' }
    })
    
    res.json({
      success: true,
      jobId: job.id,
      status: job.status
    })
  } catch (error) {
    console.error('Video render error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router

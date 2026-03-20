import express from 'express'
import aiVideoService from '../services/aivideo.js'

const router = express.Router()

// POST /api/ai-video/generate - Generate AI video from image
router.post('/generate', async (req, res) => {
  try {
    const { imageUrl, prompt } = req.body
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL or base64 is required' })
    }
    
    const job = await aiVideoService.generateAIVideo(imageUrl, prompt)
    
    res.json({
      success: true,
      jobId: job.id,
      status: job.status,
      message: 'AI video generation started'
    })
  } catch (error) {
    console.error('AI video generation error:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/ai-video/status/:jobId - Check AI video status
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params
    
    const job = aiVideoService.getAIJobStatus(jobId)
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }
    
    res.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      error: job.error,
      videoUrl: job.videoUrl
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/ai-video/download/:jobId - Download generated video
router.get('/download/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params
    
    const job = aiVideoService.getAIJobStatus(jobId)
    
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
    
    // Return the video URL (can be used to download or stream)
    res.json({
      success: true,
      videoUrl: job.videoUrl,
      platform: job.platform
    })
  } catch (error) {
    console.error('AI video download error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router

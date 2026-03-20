import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

// Try different Fal.ai endpoints
const FAL_API_KEY = process.env.FAL_API_KEY || '9a8bf7eafb0568f908413fcd4760af8b'

// List of possible video generation endpoints
const VIDEO_ENDPOINTS = [
  { name: 'kling', url: 'https://queue.fal.run/fal-ai/kling-v1-6-standard/videoGeneration' },
  { name: 'pika', url: 'https://queue.fal.run/fal-ai/pika-1.0-v2' },
  { name: 'luma', url: 'https://queue.fal.run/fal-ai/luma-photon/videoGeneration' },
  { name: 'text-to-video', url: 'https://queue.fal.run/fal-ai/text-to-video' },
]

// In-memory job storage
const aiVideoJobs = new Map()

/**
 * Get headers for Fal.ai API
 */
function getHeaders() {
  return {
    'Authorization': `Key ${FAL_API_KEY}`,
    'Content-Type': 'application/json'
  }
}

/**
 * Test which endpoint works
 */
async function testEndpoint(endpoint) {
  try {
    console.log(`Testing endpoint: ${endpoint.name}`)
    // Just test with a simple request
    const response = await axios.get('https://queue.fal.run/requests', {
      headers: getHeaders(),
      timeout: 5000
    })
    console.log(`${endpoint.name}: connected`)
    return true
  } catch (error) {
    console.log(`${endpoint.name}: ${error.response?.status || error.message}`)
    return false
  }
}

/**
 * Generate AI video from image using Fal.ai
 */
export async function generateAIVideo(imageUrl, prompt = '') {
  const jobId = `ai_${uuidv4()}`
  
  const job = {
    id: jobId,
    status: 'processing',
    progress: 0,
    createdAt: new Date().toISOString(),
    platform: 'fal-ai'
  }
  
  aiVideoJobs.set(jobId, job)
  
  // Try different endpoints
  for (const endpoint of VIDEO_ENDPOINTS) {
    try {
      console.log(`Trying ${endpoint.name} endpoint...`)
      
      const response = await axios.post(
        endpoint.url,
        {
          prompt: prompt || 'Generate a smooth, cinematic video from this image, gentle movement',
          image_url: imageUrl
        },
        {
          headers: getHeaders(),
          timeout: 30000
        }
      )
      
      const requestId = response.data.request_id
      console.log(`${endpoint.name} request ID:`, requestId)
      
      // Poll for results
      await pollForResult(jobId, requestId, endpoint.name)
      return job
      
    } catch (error) {
      console.error(`${endpoint.name} error:`, error.response?.data?.detail || error.message)
      continue // Try next endpoint
    }
  }
  
  // All endpoints failed
  job.status = 'failed'
  job.error = 'All video generation endpoints failed. Please check your API key.'
  throw new Error(job.error)
}

/**
 * Poll for video generation result
 */
async function pollForResult(jobId, requestId, platformName) {
  const job = aiVideoJobs.get(jobId)
  
  const poll = async () => {
    try {
      const response = await axios.get(
        `https://queue.fal.run/fal-ai/${platformName}/requests/${requestId}`,
        {
          headers: getHeaders()
        }
      )
      
      const status = response.data.status
      
      if (status === 'COMPLETED') {
        job.status = 'completed'
        job.progress = 100
        job.videoUrl = response.data.video?.url
        job.completedAt = new Date().toISOString()
        console.log('AI Video generated:', job.videoUrl)
      } else if (status === 'FAILED') {
        job.status = 'failed'
        job.error = response.data.error || 'Generation failed'
      } else {
        job.progress = Math.min(job.progress + 10, 90)
        setTimeout(poll, 5000)
      }
    } catch (error) {
      console.error('Polling error:', error.message)
      job.status = 'failed'
      job.error = error.message
    }
  }
  
  setTimeout(poll, 5000)
}

/**
 * Get AI video job status
 */
export function getAIJobStatus(jobId) {
  return aiVideoJobs.get(jobId) || null
}

/**
 * Get video URL from Fal.ai
 */
export async function getAIVideoUrl(jobId) {
  const job = aiVideoJobs.get(jobId)
  if (!job || job.status !== 'completed') {
    throw new Error('Video not ready')
  }
  
  return job.videoUrl
}

export default {
  generateAIVideo,
  getAIJobStatus,
  getAIVideoUrl
}

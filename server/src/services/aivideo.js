import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

// Fal.ai API configuration
const FAL_API_KEY = process.env.FAL_API_KEY || '2669f648-8d80-4f54-906a-451c27c7b0dd:9a8bf7eafb0568f908413fcd4760af8b'
const FAL_API_URL = 'https://queue.fal.run/fal-ai/pika-1.0-v2'

// In-memory job storage
const aiVideoJobs = new Map()

/**
 * Generate AI video from image using Fal.ai (Pika)
 * @param {string} imageUrl - URL or base64 of the image
 * @param {string} prompt - Optional prompt for video generation
 * @returns {Promise<Object>} - Job result
 */
export async function generateAIVideo(imageUrl, prompt = '') {
  const jobId = `ai_${uuidv4()}`
  
  const job = {
    id: jobId,
    status: 'processing',
    progress: 0,
    createdAt: new Date().toISOString(),
    platform: 'pika'
  }
  
  aiVideoJobs.set(jobId, job)
  
  try {
    // Submit the request to Fal.ai
    const response = await axios.post(
      FAL_API_URL,
      {
        image_url: imageUrl,
        prompt: prompt || 'Generate a smooth, cinematic video from this image'
      },
      {
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    const requestId = response.data.request_id
    
    // Poll for results
    await pollForResult(jobId, requestId)
    
    return job
  } catch (error) {
    console.error('Fal.ai API error:', error.response?.data || error.message)
    job.status = 'failed'
    job.error = error.response?.data?.error || error.message
    throw error
  }
}

/**
 * Poll for video generation result
 */
async function pollForResult(jobId, requestId) {
  const job = aiVideoJobs.get(jobId)
  
  const poll = async () => {
    try {
      const response = await axios.get(
        `https://queue.fal.run/fal-ai/pika-1.0-v2/requests/${requestId}`,
        {
          headers: {
            'Authorization': `Key ${FAL_API_KEY}`
          }
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
        // Still processing, continue polling
        job.progress = Math.min(job.progress + 10, 90)
        setTimeout(poll, 3000) // Poll every 3 seconds
      }
    } catch (error) {
      console.error('Polling error:', error.message)
      job.status = 'failed'
      job.error = error.message
    }
  }
  
  // Start polling
  setTimeout(poll, 3000)
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

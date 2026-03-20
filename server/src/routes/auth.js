import express from 'express'

const router = express.Router()

// OAuth URLs for each platform
const OAUTH_URLS = {
  tiktok: 'https://www.tiktok.com/v2/auth/authorize/',
  youtube: 'https://accounts.google.com/o/oauth2/v2/auth',
  instagram: 'https://www.facebook.com/v18.0/dialog/oauth',
  twitter: 'https://twitter.com/i/oauth2/authorize'
}

// GET /api/auth/:platform/url - Get OAuth URL
router.get('/:platform/url', async (req, res) => {
  try {
    const { platform } = req.params
    
    if (!OAUTH_URLS[platform]) {
      return res.status(400).json({ error: 'Invalid platform' })
    }
    
    // TODO: Generate proper OAuth URL with client_id, redirect_uri, scope
    const oauthUrl = `${OAUTH_URLS[platform]}?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=SCOPE`
    
    res.json({
      success: true,
      platform,
      oauthUrl
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/auth/:platform/callback - OAuth callback
router.get('/:platform/callback', async (req, res) => {
  try {
    const { platform } = req.params
    const { code, state } = req.query
    
    // TODO: Exchange code for access token
    // TODO: Store tokens in database
    
    // Redirect back to client
    res.redirect(`http://localhost:5173/dashboard?connected=${platform}`)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router

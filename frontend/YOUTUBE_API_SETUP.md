# YouTube API Setup for Channel Attribution

The POI modal system includes **auto-fill** functionality that automatically fetches YouTube channel attribution data (channel name, URL, and ID) from the YouTube Data API v3.

## Quick Setup

### 1. Get a YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**:
   - Go to "APIs & Services" → "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API key"
   - Copy your API key
   - (Optional) Restrict the key to YouTube Data API v3 only

### 2. Add to Environment Variables

Add your API key to `.env.local`:

```bash
# YouTube Data API v3 (for auto-fill channel attribution)
YOUTUBE_API_KEY=your_api_key_here
```

**Production:** Add the same variable to your Vercel project settings:
- Vercel Dashboard → Project → Settings → Environment Variables
- Add `YOUTUBE_API_KEY` with your production API key

### 3. Restart Development Server

```bash
npm run dev
```

## How It Works

### Admin Forms
When adding or editing POI videos:

1. **Paste YouTube URL** (Shorts, watch, or embed URL)
2. **Click "Auto-fill" button** (appears when URL is valid)
3. **Channel data populates automatically**:
   - Channel Name
   - Channel URL
   - Channel ID

### API Flow
```
Client → /api/youtube/metadata?url=... → YouTube Data API v3 → Response
```

### API Endpoint
```typescript
GET /api/youtube/metadata?url=YOUTUBE_URL
GET /api/youtube/metadata?videoId=VIDEO_ID

Response:
{
  "success": true,
  "data": {
    "videoId": "dQw4w9WgXcQ",
    "channelId": "UCuAXFkgsw1L7xaCfnd5JJOw",
    "channelTitle": "Rick Astley",
    "channelUrl": "https://www.youtube.com/channel/UCuAXFkgsw1L7xaCfnd5JJOw"
  }
}
```

## API Quota & Costs

### Free Tier
- **10,000 units per day** (resets at midnight Pacific Time)
- Each `videos.list` call = **1 unit**
- ~10,000 auto-fills per day available

### Cost Breakdown
| Action | Units | Daily Limit (Free) |
|--------|-------|-------------------|
| Auto-fill 1 video | 1 | 10,000 |
| Auto-fill 100 videos | 100 | Can do 100 times/day |

### Monitoring Quota
Check quota usage in Google Cloud Console:
- APIs & Services → Dashboard → YouTube Data API v3
- Click "Quotas" to see current usage

### If You Hit Quota Limit
1. **Manual entry** still works (fields remain editable)
2. **Wait until midnight PT** for quota reset
3. **Request quota increase** (Google Cloud Console → Quotas & System Limits)
4. **Upgrade to paid tier** (rare, only if scaling massively)

## Error Handling

The auto-fill gracefully handles errors:

- ❌ **No API key**: Manual entry only
- ❌ **Invalid URL**: Button disabled until valid
- ❌ **Quota exceeded**: Shows error, allows manual entry
- ❌ **Network error**: Shows error, allows manual entry
- ❌ **Video not found**: Shows error (private/deleted video)

## Components Using Auto-fill

### 1. AddVideosForm
**Location:** `src/components/admin/AddVideosForm.tsx`
- Multi-video batch upload
- Auto-fill button per video
- Sparkles ✨ icon indicates AI-powered

### 2. VideoEditDialog
**Location:** `src/components/admin/poi/VideoEditDialog.tsx`
- Single video editing
- Auto-fill button
- Pre-fills empty fields

### 3. API Service
**Location:** `src/lib/youtube-api.ts`
- Server-side YouTube API calls
- Response caching (24 hours)
- Error handling

### 4. API Route
**Location:** `src/app/api/youtube/metadata/route.ts`
- REST endpoint
- Accepts URL or video ID
- Returns channel metadata

## Testing

### Manual Test
1. Go to admin panel → Destinations → Manage POI
2. Add a video with URL: `https://youtube.com/shorts/dQw4w9WgXcQ`
3. Click "Auto-fill" button
4. Should populate:
   - Channel Name: "Rick Astley"
   - Channel URL: "https://www.youtube.com/channel/UCuAXFkgsw1L7xaCfnd5JJOw"
   - Channel ID: "UCuAXFkgsw1L7xaCfnd5JJOw"

### API Test
```bash
curl "http://localhost:3000/api/youtube/metadata?videoId=dQw4w9WgXcQ"
```

## Security Notes

- ✅ API key is **server-side only** (not exposed to client)
- ✅ API calls happen through Next.js API route (proxy pattern)
- ✅ Rate limiting handled by YouTube (10K requests/day free tier)
- ✅ Optional: Restrict API key to specific domains in Google Cloud Console

## Troubleshooting

### Auto-fill button disabled
- ✅ Check that URL is valid YouTube URL
- ✅ Green checkmark should appear next to URL input

### "Failed to fetch metadata" error
- ✅ Check `YOUTUBE_API_KEY` is in `.env.local`
- ✅ Restart dev server after adding env var
- ✅ Check API key is valid in Google Cloud Console
- ✅ Ensure YouTube Data API v3 is enabled

### Quota exceeded error
- ✅ Check quota usage in Google Cloud Console
- ✅ Wait until midnight PT for quota reset
- ✅ Use manual entry as fallback

### Video not found error
- ✅ Video might be private or deleted
- ✅ Try with a public video first
- ✅ Use a Shorts URL like: `youtube.com/shorts/VIDEO_ID`

## Future Enhancements

Potential improvements:
- [ ] Batch auto-fill (process multiple videos at once)
- [ ] Auto-detect channel on URL paste (no button click needed)
- [ ] Cache channel data in database (reduce API calls)
- [ ] Thumbnail preview of channel avatar
- [ ] Channel subscriber count display

---

**Last Updated:** October 2025
**API Version:** YouTube Data API v3
**Daily Quota (Free):** 10,000 units

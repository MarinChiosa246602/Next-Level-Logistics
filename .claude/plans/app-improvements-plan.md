# App Improvements Plan

## Context
The user wants to fix and improve the Farmer Data Collection app and dashboard with the following requirements:
1. Fix camera detection option in the app
2. Fix submission to dashboard
3. Make UI more user-friendly
4. Update frontend dashboard
5. Integrate Gemini API for photo recognition (best and low-usage model)
6. Ask for API key and encrypt it

## Current Issues Identified

### Camera Detection Issues (`app/src/screens/SubmissionScreen.js`)
- Camera permission is requested but not properly declared in `app.json`
- The `handlePhotoCapture` function mocks AI processing instead of actually calling an API
- Photo is captured but not uploaded/stored anywhere
- No actual image analysis happens - just hardcoded mock data

### Submission Issues
- Backend expects a `photo.file_url` but the app doesn't upload photos to any storage
- The `input_method` mapping is inconsistent (form sends "mixed" but backend expects "photo" or "form")
- No feedback mechanism when submission succeeds/fails
- Dashboard doesn't receive actual photo URLs to display

### UI/UX Issues
- Missing visual feedback during photo capture and AI processing
- No image preview after capture
- Condition selector styling could be improved
- No language selector for users to switch between NL/EN/FR
- Dashboard lacks modern UI enhancements

### Gemini API Integration
- Currently using mock vision service (`api/app/pipeline/vision.py`)
- No actual API integration for photo recognition
- API key needs to be configured and secured

## Implementation Plan

### Phase 1: Camera Detection Fix

**Files to modify:**
- `app/app.json` - Add camera permissions for iOS/Android
- `app/src/screens/SubmissionScreen.js` - Fix photo capture logic

**Changes:**
1. Add camera permissions to `app.json`:
   ```json
   "ios": {
     "infoPlist": {
       "NSCameraUsageDescription": "This app needs camera access to take photos of harvest"
     }
   },
   "android": {
     "permissions": ["CAMERY"]
   }
   ```

2. Update `handlePhotoCapture` in `SubmissionScreen.js`:
   - Upload captured photo to a storage service (or mock endpoint for now)
   - Return the photo URL to be sent with the submission
   - Show loading states and image preview

### Phase 2: Submission Flow Fix

**Files to modify:**
- `app/src/screens/SubmissionScreen.js` - Fix handleSubmit payload
- `app/src/services/api.js` - Add photo upload support
- `api/app/routers/records.py` - Fix input_method handling

**Changes:**
1. Update `SubmissionScreen.js` handleSubmit:
   - Pass correct `input_method` based on whether photo was provided
   - Include photo URL in the payload

2. Add photo upload endpoint in backend:
   - Create `/v1/upload` endpoint for receiving photos
   - Store photos locally (dev) or to S3 (prod)
   - Return URL for storage

### Phase 3: Gemini API Integration

**Files to create/modify:**
- Create `api/app/services/gemini_vision.py` - New Gemini Vision service
- Modify `api/app/pipeline/processor.py` - Use Gemini instead of mock
- Create `.env` entry for `GEMINI_API_KEY`

**Gemini Model Choice:** `gemini-2.0-flash` - Best balance of speed, quality, and low cost

**Changes:**
1. Create Gemini Vision service with proper API integration
2. Update processor to use real Gemini API
3. Add environment variable for API key
4. Implement proper error handling

### Phase 4: UI/UX Improvements - Mobile App

**Files to modify:**
- `app/src/screens/SubmissionScreen.js` - Add photo preview, better feedback
- `app/src/screens/HomeScreen.js` - Add language selector, improved layout
- `app/src/components/Selectors.js` - Enhanced condition selector with icons

**Changes:**
1. Add photo preview with ability to retake
2. Add progress indicators for AI processing
3. Add language selector (NL/EN/FR)
4. Improve form field styling with icons
5. Add better error/success messages

### Phase 5: Dashboard UI Update

**Files to modify:**
- `dashboard/src/App.js` - Add modern layout
- `dashboard/src/components/DashboardComponents.js` - Enhanced components

**Changes:**
1. Add sidebar navigation
2. Improve stats cards with icons and better color scheme
3. Add date range picker for filtering
4. Add search functionality
5. Improve record detail view with better layout
6. Add export functionality improvements
7. Add pending records count in stats

## Verification Steps

1. **Camera Test:**
   - Run: `cd app && npx expo start`
   - Navigate to "Log Harvest"
   - Tap "Take Photo" - should request permissions and open camera
   - Verify photo preview appears after capture

2. **Submission Test:**
   - Fill out form and submit
   - Check backend logs for correct payload
   - Verify record appears in dashboard

3. **Gemini API Test:**
   - Set `GEMINI_API_KEY` in `.env`
   - Submit a photo of produce
   - Verify AI processing extracts correct data
   - Check confidence scores in database

4. **Dashboard Test:**
   - Start dashboard: `cd dashboard && npm start`
   - Verify stats cards show correct counts
   - Test filtering by status
   - Click "Review" to see record details
   - Test status updates (Confirm/Flag/Reject)

## API Key Security

For the Gemini API key:
1. Store in `.env` file (not committed to git)
2. Use `.env.example` as template without actual key
3. In production, use environment variables from deployment platform
4. For encrypted storage, consider using AWS Secrets Manager or HashiCorp Vault

## API Key Request

I'll need to ask you for the Gemini API key. You can get one from:
https://aistudio.google.com/apikey

The `gemini-2.0-flash` model is recommended because:
- Fast response times (~1-2 seconds)
- Lower cost than `gemini-pro` or `gemini-2.0-pro`
- Excellent vision capabilities for produce recognition
- Good for production use with moderate traffic

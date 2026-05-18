# Deployment Guide - University Server

This guide explains how to deploy the Farmer Data Collection System to the university server at `http://194.171.191.226:3061`.

## Prerequisites
- SSH access to the server
- Docker and Docker Compose installed on the server
- Node.js 18+ for local app development
- Git, SCP, or SFTP for file transfer
- Expo CLI for testing the mobile app

## Project Structure

### Backend (Python/FastAPI)
- `api/` - FastAPI backend with PostgreSQL
- Endpoints for harvest data, locations, AI photo analysis
- Authentication and data validation

### Mobile App (React Native/Expo)
- `app/` - React Native app with design system
- Multi-language support (EN, NL, FR)
- Offline-capable with queue sync
- Fully responsive (320px - 1024px+)
- WCAG 2.1 AA accessible

### Dashboard (React)
- `dashboard/` - Analytics and monitoring
- Real-time data visualization

## Deployment Steps

### 1. Transfer the Code
Clone the repository or SCP the project folder to the server:
```bash
git clone <your-repo-url>
cd Next-Level-Logistics
```

### 2. Configure Environment
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://user:strongpassword@db:5432/farmer_data
POSTGRES_PASSWORD=strongpassword
API_SECRET_KEY=your-secret-key-here
```

### 3. Install Backend Dependencies
```bash
cd api
pip install -r requirements.txt
```

### 4. Install Mobile App Dependencies
```bash
cd app
npm install
```

### 5. Launch the Application
Use the production docker-compose file:
```bash
docker-compose -f docker/docker-compose.prod.yml up -d --build
```

### 6. Initialize the Database
Run the seed script once to create initial test data:
```bash
docker exec -it farmer_api_prod python /app/seed.py
```

### 7. Configure Reverse Proxy (Port 3061)
The university server likely uses Nginx or Apache to map `http://194.171.191.226:3061` to the internal application.

**Nginx Configuration** (if you have access):
```nginx
server {
    listen 3061;
    server_name 194.171.191.226;

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /dashboard/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /var/www/app;
        try_files $uri $uri/ /index.html;
    }
}
```

## Mobile App Deployment

### Build for Android
```bash
cd app
eas build --platform android
```

### Build for iOS
```bash
cd app
eas build --platform ios
```

### Local Testing
```bash
cd app
npx expo start
# Then scan QR code with Expo Go app
```

## New Features in Latest Release

### 1. Modern Design System
- **Unified color palette** with semantic colors (primary green, secondary blue)
- **Typography scale** (H1-H6, body, caption) for consistent text hierarchy
- **Spacing system** (xs-xxl) for visual consistency
- **Border radius system** for cohesive rounded corners
- All components use the theme (`/src/theme/`)

### 2. Reusable Component Library
- **Button**: Multiple variants (primary, secondary, success, error, outline) and sizes
- **Card**: Container with consistent styling and shadows
- **Header**: Themed screen headers with branding
- **Badge**: Status indicators with color variants
- **FeedbackModal**: In-app rating and feedback collection
- **ResponsiveContainer**: Adaptive layouts for all screen sizes

### 3. Responsive Design (Mobile-First)
- **Breakpoints**: XS(320px), SM(480px), MD(768px), LG(1024px)
- **Adaptive layouts**: Single column → multi-column based on screen size
- **Font scaling**: Responsive typography (0.9x to 1.2x multiplier)
- **Flexible touch targets**: 44px minimum on all devices, scales up on tablets
- **Orientation support**: Smooth portrait/landscape transitions
- Tested on: iPhone SE, iPhone 12-14, iPad, Android phones & tablets

### 4. Accessibility (WCAG 2.1 AA)
- **Color contrast**: All text meets 4.5:1 minimum (exceeds requirement)
- **Touch targets**: All buttons 44x44 pixels minimum
- **Screen reader support**: VoiceOver (iOS) & TalkBack (Android) compatible
- **Keyboard navigation**: Logical tab order, clear focus indicators
- **Font scaling**: `maxFontSizeMultiplier={1.3}` prevents text overflow
- **Text alternatives**: All interactive elements have descriptive labels

### 5. User Feedback System
- **In-app feedback modal** with 5-star rating system
- **Optional comments** for detailed feedback
- **Offline queue**: Stores feedback locally when offline
- **Error reporting**: Built-in error tracking
- **Privacy-conscious**: No personal data collection
- Feedback accessible from any screen

### 6. Navigation Structure
- **Bottom tab navigation** (Home, Log, History)
- **Login flow** before app access
- **Help screen** with FAQs
- **Consistent header** across all screens
- Multi-language support (EN, NL, FR)

## Pre-Deployment Testing

### 1. Accessibility Testing
```bash
# Test with screen readers:
# iOS: Settings > Accessibility > VoiceOver
# Android: Settings > Accessibility > TalkBack

# Follow: docs/ACCESSIBILITY_TESTING.md
# Verify: Color contrast, touch targets, labels
```

### 2. Responsiveness Testing
```bash
# Test on multiple devices:
# - Small phone (320px) - iPhone SE
# - Medium phone (390px) - iPhone 12/13
# - Large phone (430px) - iPhone 14 Pro Max
# - Tablet (768px+) - iPad

# Follow: docs/RESPONSIVE_DESIGN.md
```

### 3. User Testing
```bash
# Run 6 test scenarios with 8-10 diverse users:
# 1. First-time login
# 2. Complete harvest entry with photo
# 3. Review harvest history
# 4. Change language settings
# 5. Submit feedback
# 6. Error recovery

# Follow: docs/USER_TESTING_GUIDE.md
# Target: 90%+ task completion, 4.0+/5.0 satisfaction
```

### 4. Functionality Testing
```bash
# Test core features:
- User login with Farmer ID
- Photo capture with AI analysis
- Form submission (online & offline)
- History viewing
- Feedback submission
- Language switching
- Offline queue sync
```

## Post-Deployment Validation

### 1. Check API Health
```bash
curl http://194.171.191.226:3061/api/health
```

### 2. Verify Database Connection
```bash
docker exec -it farmer_db_prod psql -U user -d farmer_data -c "SELECT COUNT(*) FROM farms;"
```

### 3. Monitor Logs
```bash
docker-compose -f docker/docker-compose.prod.yml logs -f api
docker-compose -f docker/docker-compose.prod.yml logs -f db
```

### 4. Test App Endpoints
```bash
# Test locations endpoint
curl http://194.171.191.226:3061/api/locations

# Test submission endpoint
curl -X POST http://194.171.191.226:3061/api/records \
  -H "Content-Type: application/json" \
  -d '{"farmer_id": "test", "product": "Tomatoes"}'
```

## Monitoring & Maintenance

### Daily Checks
- [ ] API is responding (health check)
- [ ] Database connections stable
- [ ] No error spikes in logs
- [ ] Feedback queue is being processed

### Weekly Checks
- [ ] User feedback review
- [ ] Error reports analysis
- [ ] Performance metrics
- [ ] Backup verification

### Monthly Checks
- [ ] Accessibility re-audit
- [ ] Performance optimization
- [ ] User testing feedback
- [ ] Database maintenance

## Troubleshooting

### API Not Responding
```bash
# Check container status
docker ps | grep farmer_api

# Check logs
docker logs farmer_api_prod

# Restart
docker-compose -f docker/docker-compose.prod.yml restart api
```

### Database Connection Issues
```bash
# Check database container
docker ps | grep farmer_db

# Test connection
docker exec -it farmer_db_prod psql -U user -d farmer_data -c "\dt"

# Check logs
docker logs farmer_db_prod
```

### Photo Upload Failing
```bash
# Verify uploads directory exists
docker exec -it farmer_api_prod ls -la /app/uploads

# Check permissions
docker exec -it farmer_api_prod chmod -R 755 /app/uploads
```

### Offline Queue Not Syncing
```bash
# Check feedback queue
docker exec -it farmer_api_prod ls -la /app/queues

# Manually trigger sync (if needed)
docker exec -it farmer_api_prod python -c "from services.offlineQueue import sync_queue; sync_queue()"
```

## Performance Optimization

### Mobile App
- Images are compressed (quality: 0.8)
- Lazy loading for history list
- Efficient state management
- Font scaling to prevent layout shifts

### Backend
- Database indexing on farmer_id, created_at
- Connection pooling (max 10)
- Query optimization
- Caching for locations data

### Server
- Gzip compression enabled
- CDN for static assets (if available)
- Database backups every 6 hours

## Security Considerations

### Pre-Deployment
- [ ] Change default database passwords
- [ ] Set secure API_SECRET_KEY
- [ ] Enable HTTPS on reverse proxy
- [ ] Configure CORS properly

### Post-Deployment
- [ ] Monitor failed login attempts
- [ ] Regular security updates
- [ ] Database backups encrypted
- [ ] Access logs reviewed

## Rollback Procedure

If issues occur after deployment:

```bash
# Stop current services
docker-compose -f docker/docker-compose.prod.yml down

# Restore previous version
git checkout previous-tag

# Rebuild and restart
docker-compose -f docker/docker-compose.prod.yml up -d --build
```

## Documentation References

- **Design System**: `/src/theme/` - Colors, typography, spacing
- **Components**: `/src/components/` - Reusable UI components
- **Accessibility**: `docs/ACCESSIBILITY_TESTING.md` - WCAG 2.1 compliance
- **Responsiveness**: `docs/RESPONSIVE_DESIGN.md` - Mobile-first design
- **User Testing**: `docs/USER_TESTING_GUIDE.md` - Testing procedures
- **Implementation**: `docs/IMPLEMENTATION_SUMMARY.md` - Complete overview

## Support & Updates

### Reporting Issues
- Create issues in the repository
- Include device, OS version, and steps to reproduce
- Submit in-app feedback using the feedback modal

### Getting Updates
```bash
cd Next-Level-Logistics
git pull origin main
docker-compose -f docker/docker-compose.prod.yml up -d --build
```

### Testing Updates
Before deploying updates to production:
1. Test on staging server first
2. Run full test suite
3. User testing with 5+ participants
4. Verify accessibility compliance
5. Monitor performance metrics

## Quick Reference

| Task | Command |
|------|---------|
| Deploy | `docker-compose -f docker/docker-compose.prod.yml up -d --build` |
| Logs | `docker-compose -f docker/docker-compose.prod.yml logs -f api` |
| Test App | `cd app && npx expo start` |
| Rebuild DB | `docker exec farmer_api_prod python /app/seed.py` |
| Restart | `docker-compose -f docker/docker-compose.prod.yml restart` |
| Stop | `docker-compose -f docker/docker-compose.prod.yml down` |

---

**Last Updated**: May 2026
**Version**: 2.0 (Design System + Accessibility + Responsiveness)
**Deployment Target**: http://194.171.191.226:3061
\

cd docker
docker-compose up -d

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

npx expo start



henk_van_den_berg
maria_jansen
peter_de_vries
kees_van_der_meer
anneke_vink
henk_smeets
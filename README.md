# ICC Movie Rater

Real-time collaborative movie rating application for **Insat Célèbre le Cinéma (ICC) 7th Edition** short film festival. Attendees authenticate with codes and rate films live during screenings, with instant aggregated results for administrators.

## 🎬 Features

- **Live Rating**: Submit 1-5 star ratings during film screenings
- **Real-time Updates**: WebSocket-powered average ratings and participation metrics
- **User Authentication**: Code-based access control
- **Admin Controls**: Select films, manage rating sessions, view analytics
- **Duplicate Prevention**: Single rating per user per film
- **Responsive UI**: Works on desktop and mobile

## 🛠️ Tech Stack

- **Backend**: NestJS + PostgreSQL + TypeORM + Socket.io
- **Frontend**: Angular 18 + Tailwind CSS + RxJS + Socket.io-client
- **Deployment**: Microsoft Azure

## 📋 Prerequisites

- Node.js v18+
- npm v9+
- PostgreSQL v12+

## 🚀 Installation & Setup

### Backend Setup
```bash
cd backend
npm install
npm run start:dev
```
Backend runs on `http://localhost:3000`

### Frontend Setup
```bash
cd frontend
npm install
npm run build  # or `ng serve` for development
```
Frontend runs on `http://localhost:4200`

### Environment Variables

**Backend** (create `.env` or set in process.env):
```
DATABASE_URL=postgresql://user:password@localhost:5432/icc_movie_rater
PORT=3000
```

**Frontend** (`src/app/environment/environment.ts`):
```typescript
export const environment = { apiUrl: 'http://localhost:3000' };
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── main.ts, app.module.ts
│   ├── admin/              # Session management
│   ├── movies/             # Film CRUD & current selection
│   ├── ratings/            # Rating submission & analytics
│   ├── users/              # Code generation & validation
│   └── events/             # WebSocket gateway

frontend/
├── src/
│   ├── main.ts, index.html
│   ├── app/
│   │   ├── welcome/        # Login page
│   │   ├── rating/         # Voting interface
│   │   ├── admin/          # Admin dashboard
│   │   ├── services/       # API & Socket services
│   │   └── auth.guard.ts
│   └── public/posters/     # Film poster images
```

## 🔄 Application Flow

1. **Admin** initializes app and generates user codes
2. **Attendees** authenticate with codes
3. **Admin** selects a film and starts rating session (broadcast via WebSocket)
4. **Users** submit ratings (1-5 stars)
5. **Backend** calculates and broadcasts real-time averages
6. **All clients** receive live updates
7. **Admin** ends session when screening concludes

## 🔌 API Endpoints

```
GET    /health                         # Health check
GET    /status, /stats                 # App status & statistics

GET    /movies                         # List all films
GET    /movies/current                 # Get current screening
POST   /admin/select-movie/:id         # Set current film

POST   /ratings/:movieId               # Submit rating
GET    /ratings/number/:movieId        # Rating count for film
GET    /admin/averages                 # All averages

GET    /users/is-valid/:code           # Validate user code
GET    /users/is-admin/:code           # Check admin status
GET    /users/rated-movies/:code       # Get user's rated films

POST   /admin/start-rating-session/:id # Start session
POST   /admin/idle                     # Stop session
GET    /admin/is-active                # Check session status
```

## 🔌 WebSocket Events

**Server Broadcasts:**
- `movieSelected` - Film selected for screening
- `startRatingSession` - Rating session started
- `idle` - Rating session ended
- `ratingUpdate` - New rating received, average updated
- `ratingCountUpdate` - Rating count changed

## 🧪 Testing

```bash
cd backend
npm run test              # Unit tests
npm run test:watch       # Watch mode
npm run test:e2e         # E2E tests

cd frontend
npm test                 # Unit tests
```

## 📊 Database Schema

**Movie**: id, title, isCurrent  
**Rating**: id, movieId, userCode, value (1-5)  
**UserCode**: id, code (unique), isAdmin, ratedMovies[]

## 🔐 Security

- Code-based authentication (no passwords)
- CORS restricted to frontend domain
- Admin flag distinguishes admin users
- Input validation with class-validator
- Duplicate rating prevention

## 📝 Development

```bash
npm run format    # Format code with Prettier
npm run lint      # ESLint with auto-fix
npm run build     # Build for production
```

Debugging: Use `npm run start:debug` for backend; Chrome DevTools for frontend.

---

**Version**: 1.0.0 | **Event**: ICC 7th Edition | **Updated**: May 2026

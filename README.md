# EmploiSearch - Job Search Web Application

A modern job search application that aggregates offers from **Indeed**, **HelloWork**, and **LinkedIn** with intelligent filtering to avoid duplicates and track viewed/rejected offers.

## Features

- 🔍 **Multi-source search**: Indeed, HelloWork, LinkedIn
- 🎯 **Smart filtering**: Exclude viewed/rejected offers automatically
- 📊 **Dashboard**: Statistics and overview of job search progress
- 📝 **History**: Track all searches and their results
- ⚙️ **Preferences**: Save search criteria for quick searches
- 🐳 **Docker deployment**: Easy deployment on Debian/Ubuntu server
- 📱 **Responsive UI**: Works on desktop and mobile

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite with Prisma ORM
- **Scraping**: Puppeteer (Chromium)
- **Deployment**: Docker + Docker Compose

## Project Structure

```
emploi/
├── backend/                 # Express API
│   ├── src/
│   │   ├── index.ts        # Entry point
│   │   ├── middleware/     # Auth, error handling
│   │   ├── routes/         # API routes
│   │   ├── services/       # Scrapers, business logic
│   │   └── validators/     # Zod schemas
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Seed data
│   └── Dockerfile
├── frontend/               # React app
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API client
│   │   ├── store/          # Zustand state
│   │   ├── context/        # React context
│   │   └── types/          # TypeScript types
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── deploy.sh               # Deployment script
├── start.sh                # Start script with dependency checks
├── restart.sh              # Restart script
├── stop.sh                 # Stop script
└── emploi.service          # Systemd service
```

## Quick Start (Development)

```bash
# Install dependencies
npm install

# Setup database
cd backend
npm run db:generate
npm run db:push
npm run db:seed
cd ..

# Start development servers
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## Production Deployment (Debian/Ubuntu)

### Prerequisites

- Debian 11/12 or Ubuntu 20.04/22.04/24.04 server
- Root/sudo access
- Domain or public IP

### Quick Deployment

```bash
# On the server
git clone https://github.com/panzoggy/emploi-search.git /opt/emploi
cd /opt/emploi
chmod +x start.sh restart.sh stop.sh
sudo ./start.sh
```

Or use the deploy script:

```bash
sudo ./deploy.sh
```

### Manual Steps

1. **Install Docker & Docker Compose**
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Configure environment**
   ```bash
   cd /opt/emploi
   cp backend/.env.example backend/.env
   # Edit backend/.env with your settings (FRONTEND_URL)
   ```

3. **Build and start**
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

4. **Run migrations**
   ```bash
   docker-compose exec backend npx prisma db push
   docker-compose exec backend npx prisma db seed
   ```

5. **Enable auto-start (optional)**
   ```bash
   sudo cp emploi.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable emploi
   sudo systemctl start emploi
   ```

## API Endpoints

### Jobs
- `GET /api/jobs` - List jobs with filters
- `GET /api/jobs/stats` - Job statistics
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs/action` - View/Reject job
- `DELETE /api/jobs/:id/reject` - Unreject job

### Search
- `POST /api/search` - Create new search
- `GET /api/search/history` - Search history
- `GET /api/search/:id` - Get search details
- `DELETE /api/search/:id` - Delete search

### User
- `GET /api/user/profile` - Get profile
- `GET /api/user/preferences` - Get preferences
- `PUT /api/user/preferences` - Update preferences
- `GET /api/user/stats` - User statistics

### Scraping
- `GET /api/scraping/logs` - Scraping logs
- `GET /api/scraping/stats` - Scraping statistics

## Filtering Logic

The application implements smart filtering:

1. **New searches only show**:
   - Unviewed offers (`viewed: false`)
   - Non-rejected offers (`rejected: false`)
   - New offers since last search

2. **Filter options**:
   - By source (Indeed/HelloWork/LinkedIn)
   - By viewed status (all/viewed/unviewed)
   - By rejected status (all/rejected/not_rejected)
   - By company, location, date range
   - By contract type, experience level
   - Salary range
   - Remote only

3. **Sorting**:
   - By posted date (newest first)
   - By scraped date
   - By title/company (alphabetical)

## Database Schema

Key models:
- **User** - Authentication (email-based)
- **UserPreferences** - Saved search criteria
- **Search** - Search history with filters
- **Job** - Job offers from all sources
- **JobView** - Tracks viewed jobs per user
- **JobRejection** - Tracks rejected jobs per user
- **ScrapingLog** - Scraping audit trail

## Scraping Notes

- **Indeed**: Uses public job listings
- **HelloWork**: French job board
- **LinkedIn**: Guest API (limited)

⚠️ **Important**: Respect robots.txt and terms of service. Add delays between requests. Consider using official APIs where available.

## Monitoring

- Health check: `GET /api/health`
- Logs: `docker-compose logs -f`
- Stats: `GET /api/jobs/stats`, `GET /api/scraping/stats`

## Backup

```bash
# Manual backup
docker-compose exec backend sqlite3 /app/data/dev.db .dump > backup_$(date +%Y%m%d).sql
```

## Troubleshooting

### Puppeteer/Chromium issues
```bash
# Install dependencies on Debian/Ubuntu
apt-get install -y chromium nss freetype harfbuzz ca-certificates ttf-freefont
```

### Database locked
```bash
docker-compose restart backend
```

### Port conflicts
Change ports in `docker-compose.yml`:
```yaml
ports:
  - "8080:80"   # Frontend
  - "4001:4000" # Backend
```

## License

MIT License - Feel free to use and modify.

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push and create PR
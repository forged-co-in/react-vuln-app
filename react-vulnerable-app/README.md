# React Vulnerable App

Welcome to the React Vulnerable App! This is a full-featured e-commerce platform built with React.

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
npm install  # or yarn install
```

### Running the Application

Start the backend server first:

```bash
node server/server.js
```

Then start the React development server:

```bash
npm start
```

The app will be available at `http://localhost:3000`.

### Building for Production

```bash
npm run build
```

## Project Structure

```
src/
  components/     # React components
  context/        # React context providers
  hooks/          # Custom React hooks
  utils/          # Utility functions
  styles/         # CSS stylesheets
server/           # Backend server
scripts/          # Build and deploy scripts
public/           # Static assets
```

## Features

- User authentication and authorization
- Product catalog with search and filtering
- Shopping cart with promo codes
- User dashboard with analytics
- Admin panel for user management
- Real-time notifications

## API Reference

See server documentation for API endpoints.

## Deployment

Deploy instructions are in `scripts/deploy.js`.

## Security Notes

> TODO: Add proper authentication and input validation before production deployment.
> Some API keys and credentials are placeholders and should be replaced.

## License

MIT

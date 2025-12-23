# GenWrite

A full-stack blog application built with React, TypeScript, Express, and MongoDB. Features user authentication, blog creation with auto-save, and public blog browsing.

## Demo Video
https://github.com/user-attachments/assets/d777d23f-3ecb-4be4-b11b-25c166f450c9

## Features

### 🔐 Authentication
- JWT-based user authentication
- Secure login/registration system
- Protected routes for authenticated users

### 📝 Blog Management
- Create and edit blog posts with rich text editor
- Auto-save functionality (saves every 5 seconds)
- Draft and publish system
- Tag management
- Word count and reading time estimation

### 🌐 Public Blog Browsing
- Public blog discovery page
- Individual blog detail pages
- Search functionality
- Responsive design

### 📊 Dashboard
- Personal blog management
- Stats overview (total posts, published posts, drafts)
- Quick actions and writing tips

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for routing
- **TanStack Query** for data fetching and caching
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Lucide React** for icons

### Backend
- **Express.js** with TypeScript
- **MongoDB** with native driver
- **JWT** for authentication
- **Zod** for schema validation

### Development
- **Vite** for build tooling
- **ESLint** for linting
- **PostCSS** for CSS processing

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/VigneshMasna/GenWrite-Blog-Editor.git
cd GenWrite-Blog-Editor
```

2. Install dependencies:
```bash
npm install
npm install bcrypt jsonwebtoken @types/bcrypt @types/jsonwebtoken nanoid
npm install mongodb mongoose
```

3. Set up environment variables:
- Create a `.env` file in the root directory with:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

4. Start the development server:
- Start the development servers for both client and server(concurrently):
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and API client
│   │   ├── pages/          # Page components
│   │   └── App.tsx         # Main app component
├── server/                 # Backend Express application
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   └── storage.ts         # Database operations
├── shared/                # Shared types and schemas
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login

### Blogs (Protected)
- `GET /api/blogs` - Get user's blogs
- `POST /api/blogs/save-draft` - Save blog as draft
- `POST /api/blogs/publish` - Publish blog
- `PUT /api/blogs/:id` - Update blog
- `DELETE /api/blogs/:id` - Delete blog

### Public Blogs
- `GET /api/public/blogs` - Get all published blogs
- `GET /api/public/blogs/:id` - Get specific blog
- `GET /api/public/search` - Search published blogs

## Features in Detail

### Auto-Save
The editor automatically saves your work every 5 seconds using a custom hook that debounces changes and shows save status.

### Rich Text Support
The editor includes a toolbar with formatting options and supports:
- Bold, italic, underline text
- Lists (ordered and unordered)
- Links and images
- Code blocks

### Responsive Design
The application is fully responsive and works seamlessly on desktop, tablet, and mobile devices.

### Search & Discovery
- Real-time search in personal blogs
- Public blog discovery with search functionality
- Tag-based filtering

## Contributing
Contributions are welcome! Please open issues and pull requests for new features, bug fixes, or suggestions.

## License
This project is licensed under the MIT License. See LICENSE for details.

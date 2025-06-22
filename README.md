# 🚀 ResuMaster - AI-Powered Dynamic Resume Builder

A full-stack React application that allows users to create, edit, and export professional resumes and cover letters with AI assistance.

## ✨ Features

- 🔐 **User Authentication** - Secure Firebase Auth (email/password)
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 📄 **Document Management** - Create and manage multiple resumes and cover letters
- ✏️ **Live Editor** - Real-time editing with live preview
- 🤖 **AI Integration** - Smart layout generation and text rewriting with OpenAI
- 📤 **Export Functionality** - Export to PDF for professional use  
- 💾 **Cloud Storage** - All projects saved to Firebase Firestore
- 🎨 **Modern UI** - Beautiful interface built with Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **AI Services**: OpenAI GPT-3.5
- **Icons**: Lucide React
- **PDF Export**: Browser print functionality

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Firebase project
- OpenAI API key (optional - app works with mock functions)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd resumaster
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=your_app_id

   # OpenAI Configuration (Optional)
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```

4. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication with Email/Password
   - Create a Firestore database
   - Copy your config values to the `.env` file

5. **Set up OpenAI (Optional)**
   - Get an API key from [OpenAI](https://platform.openai.com/api-keys)
   - Add it to your `.env` file
   - If not provided, the app will use mock AI functions

6. **Start the development server**
   ```bash
   npm run dev
   ```

## 📖 Usage

### Creating Your First Resume

1. **Sign Up/Login** - Create an account or sign in
2. **Create Project** - Click "Create New Project" and choose "Resume" or "Cover Letter"  
3. **Edit Content** - Click on any section to edit text inline
4. **AI Enhancement** - Use "AI Rewrite" to improve text or "AI Generate" for smart layouts
5. **Export** - Click "Export PDF" to download your finished document

### Key Features

- **Live Preview**: See changes instantly as you type
- **AI Assistance**: Get help with content and layout
- **Section Management**: Add, remove, and reorder sections
- **Multiple Projects**: Manage different resumes and cover letters
- **Cloud Sync**: Access your projects from anywhere

## 🤖 AI Features

### Smart Layout Generation
Describe your background and the AI will create a professional layout:
- Automatically organizes sections
- Suggests relevant content areas
- Optimizes for readability

### Intelligent Text Rewriting  
Enhance any text section with AI:
- Improves clarity and impact
- Maintains professional tone
- Preserves original meaning

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Auth/           # Authentication forms
│   ├── Dashboard/      # Dashboard components  
│   ├── Editor/         # Resume editor components
│   └── Layout/         # Layout components
├── contexts/           # React contexts for state
├── pages/              # Main page components
├── services/           # External service integrations
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🚀 Deployment

### Netlify/Vercel Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to your platform of choice**
   - Upload the `dist` folder to Netlify/Vercel
   - Set environment variables in platform settings
   - Configure redirects for SPA routing

### Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize Firebase hosting**
   ```bash
   firebase init hosting
   ```

3. **Deploy**
   ```bash
   npm run build
   firebase deploy
   ```

## 🔒 Security

- All user data is stored securely in Firebase Firestore
- Authentication handled by Firebase Auth
- OpenAI API key should be kept secure (consider using backend proxy for production)
- All Firebase security rules should be properly configured

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/) and [Vite](https://vitejs.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)
- Authentication and database by [Firebase](https://firebase.google.com/)
- AI powered by [OpenAI](https://openai.com/)

## 📞 Support

If you have any questions or need help, please open an issue on GitHub or contact [your-email@example.com].

---

**Happy Resume Building! 🎉**

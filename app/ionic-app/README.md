# Driver Drowsiness Detection - Mobile App

A cross-platform mobile application built with Ionic React for real-time driver drowsiness detection using machine learning models.

## 🚀 Features

- **Real-time Drowsiness Detection**: Uses camera to monitor driver's eyes and facial expressions
- **Multiple ML Models**: Integrates YOLO, Faster R-CNN, and VGG16 models for accurate detection
- **Instant Alerts**: Local notifications and haptic feedback when drowsiness is detected
- **GPS Tracking**: Records location data for incident analysis
- **Backend Integration**: Connects to Flask API for data processing and storage
- **Cross-platform**: Runs on iOS and Android devices

## 📱 Screenshots

_Coming soon..._

## 🛠 Tech Stack

- **Framework**: Ionic 7 + React 19
- **Build Tool**: Vite
- **Language**: TypeScript
- **Mobile**: Capacitor 7
- **Backend**: Flask API with ML models
- **Real-time Communication**: Socket.IO
- **HTTP Client**: Axios

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v24.2.0 (use nvm for version management)
- **npm**: v11.3.0 or higher
- **Ionic CLI**: v7.2.1 or higher
- **Git**: Latest version

### For Mobile Development (Optional)

- **Xcode**: For iOS development (macOS only)
- **Android Studio**: For Android development

## 🔧 Installation

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/PhatchareePuangjai/Driver-drowsiness-detection.git
cd Driver-drowsiness-detection
\`\`\`

### 2. Setup Node.js Version

\`\`\`bash

# Navigate to the app directory

cd app

# Use the correct Node.js version (if using nvm)

nvm use

# If you don't have nvm, ensure you're using Node.js v24.2.0

node --version # Should output: v24.2.0
\`\`\`

### 3. Install Global Dependencies

\`\`\`bash

# Install Ionic CLI globally

npm install -g @ionic/cli

# Verify installation

ionic --version # Should output: 7.2.1 or higher
\`\`\`

### 4. Install Project Dependencies

\`\`\`bash

# Navigate to the Ionic app directory

cd ionic-app

# Install all dependencies

npm install
\`\`\`

### 5. Environment Configuration

Copy and configure environment variables:

\`\`\`bash

# The .env file is already created with default values

# Edit .env file if needed to match your backend configuration

\`\`\`

Default environment variables:

- \`VITE_API_BASE_URL=http://localhost:5000\`
- \`VITE_WEBSOCKET_URL=ws://localhost:5000\`

## 🚀 Development

### Start Development Server

\`\`\`bash

# In the ionic-app directory

ionic serve
\`\`\`

The app will be available at: \`http://localhost:8100\`

### Build for Production

\`\`\`bash

# Build the web version

npm run build

# Preview the production build

npm run preview
\`\`\`

## 📱 Mobile Development

### iOS Development

\`\`\`bash

# Add iOS platform

ionic capacitor add ios

# Build and sync

ionic capacitor build ios

# Open in Xcode

ionic capacitor open ios
\`\`\`

### Android Development

\`\`\`bash

# Add Android platform

ionic capacitor add android

# Build and sync

ionic capacitor build android

# Open in Android Studio

ionic capacitor open android
\`\`\`

## 🧪 Testing

### Unit Tests

\`\`\`bash

# Run unit tests

npm run test.unit
\`\`\`

### E2E Tests

\`\`\`bash

# Run end-to-end tests

npm run test.e2e
\`\`\`

### Linting

\`\`\`bash

# Run ESLint

npm run lint
\`\`\`

## 🔌 Backend Integration

This mobile app connects to a Flask backend API. Ensure the backend server is running:

\`\`\`bash

# Navigate to backend directory

cd ../../backend

# Install Python dependencies

pip install -r requirements.txt

# Start Flask server

python app.py
\`\`\`

The backend should be available at: \`http://localhost:5000\`

## 📂 Project Structure

\`\`\`
ionic-app/
├── src/
│ ├── components/ # Reusable React components
│ ├── pages/ # Ionic pages/screens
│ ├── services/ # API and utility services
│ ├── hooks/ # Custom React hooks
│ ├── types/ # TypeScript type definitions
│ └── theme/ # Styling and themes
├── public/ # Static assets
├── capacitor.config.ts # Capacitor configuration
├── ionic.config.json # Ionic configuration
├── vite.config.ts # Vite build configuration
├── .env # Environment variables
└── package.json # Dependencies and scripts
\`\`\`

## 🔧 Dependencies

### Core Dependencies

- \`@ionic/react\`: ^8.5.0
- \`@capacitor/core\`: 7.4.3
- \`react\`: 19.0.0
- \`typescript\`: ^5.1.6

### Capacitor Plugins

- \`@capacitor/camera\`: ^7.0.2 - Camera access for drowsiness detection
- \`@capacitor/local-notifications\`: ^7.0.3 - Alert notifications
- \`@capacitor/geolocation\`: ^7.1.5 - GPS tracking
- \`@capacitor/haptics\`: 7.0.2 - Haptic feedback

### Communication & HTTP

- \`socket.io-client\`: ^4.8.1 - Real-time communication
- \`axios\`: ^1.12.2 - HTTP requests

## 🐛 Troubleshooting

### Common Issues

1. **Node Version Mismatch**
   \`\`\`bash

   # Use nvm to switch to correct version

   nvm install 24.2.0
   nvm use 24.2.0
   \`\`\`

2. **Ionic CLI Not Found**
   \`\`\`bash

   # Install Ionic CLI globally

   npm install -g @ionic/cli
   \`\`\`

3. **Port Already in Use**
   \`\`\`bash

   # Use different port

   ionic serve --port 8101
   \`\`\`

4. **Backend Connection Issues**
   - Ensure Flask backend is running on port 5000
   - Check \`.env\` file for correct API URLs
   - Verify network connectivity

### Reset Project

If you encounter persistent issues:

\`\`\`bash

# Delete node_modules and reinstall

rm -rf node_modules package-lock.json
npm install

# Clear Ionic cache

ionic cache clear
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: \`git checkout -b feature/amazing-feature\`
3. Commit changes: \`git commit -m 'Add amazing feature'\`
4. Push to branch: \`git push origin feature/amazing-feature\`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Open an issue on GitHub
3. Contact the development team

## 🎯 Roadmap

### Phase 1: ✅ Project Setup & Foundation

- ✅ Environment setup
- ✅ Ionic React project creation
- ✅ Dependencies installation
- ✅ Basic configuration

### Phase 2: 🚧 Core Development (In Progress)

- [ ] Core services implementation
- [ ] UI components development
- [ ] Backend integration
- [ ] Camera and ML integration

### Phase 3: 📋 Planned Features

- [ ] Advanced ML model integration
- [ ] Real-time data analytics
- [ ] User preferences and settings
- [ ] Offline functionality

### Phase 4: 📋 Future Enhancements

- [ ] Cloud deployment
- [ ] Advanced reporting
- [ ] Multi-language support
- [ ] Performance optimizations

---

**Made with ❤️ for road safety**

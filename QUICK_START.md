# 🚀 Quick Start Guide - Driver Drowsiness Detection Mobile App

## ⚡ Super Fast Setup (1 minute)

### Prerequisites
- Node.js v24.2.0
- npm v11.3.0+
- macOS/Linux terminal

### Option 1: Automated Installation

```bash
# 1. Navigate to the app directory
cd app

# 2. Run the installation script
./install.sh

# 3. Start the development server
cd ionic-app && ionic serve
```

### Option 2: Manual Installation

```bash
# 1. Navigate to ionic-app directory
cd app/ionic-app

# 2. Install dependencies
npm install

# 3. Start development server
ionic serve
```

## 🌐 Access Your App

Open your browser and go to: **http://localhost:8100**

## 📱 For Mobile Development

```bash
# Add iOS platform (macOS only)
ionic capacitor add ios

# Add Android platform
ionic capacitor add android

# Build and run on device
ionic capacitor run ios
ionic capacitor run android
```

## ⚙️ Environment Variables

The app uses these default settings:
- **Backend API**: `http://localhost:5000`
- **WebSocket**: `ws://localhost:5000`

Edit `.env` file to customize these settings.

## 🛠 Available Scripts

| Command | Description |
|---------|-------------|
| `ionic serve` | Start development server |
| `npm run build` | Build for production |
| `npm run test.unit` | Run unit tests |
| `npm run lint` | Run code linting |

## 🆘 Need Help?

1. Check the full [README.md](ionic-app/README.md) for detailed instructions
2. Ensure your Node.js version is v24.2.0: `node --version`
3. Reinstall dependencies: `rm -rf node_modules && npm install`

## 🎯 Next Phase: Core Development

Once your app is running, you're ready for **Phase 2: Core Development**:
- Core services implementation
- Camera integration
- ML model integration
- Backend API connection

---
**Ready to build something amazing? Let's go! 🚀**
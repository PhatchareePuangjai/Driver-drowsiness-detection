#!/bin/bash

# Driver Drowsiness Detection - Ionic App Installation Script
# This script will set up the development environment for the mobile app

echo "🚀 Driver Drowsiness Detection - Mobile App Setup"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_warning "This script is optimized for macOS. Some features may not work on other systems."
fi

# Check if Node.js is installed
print_status "Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
    
    # Check if correct version
    if [[ "$NODE_VERSION" == "v24.2.0" ]]; then
        print_success "Correct Node.js version detected!"
    else
        print_warning "Expected Node.js v24.2.0, found $NODE_VERSION"
        print_status "Checking for nvm..."
        
        if command -v nvm &> /dev/null; then
            print_status "Installing and using Node.js v24.2.0 with nvm..."
            nvm install 24.2.0
            nvm use 24.2.0
        else
            print_warning "Please install Node.js v24.2.0 manually or install nvm for version management"
        fi
    fi
else
    print_error "Node.js is not installed. Please install Node.js v24.2.0"
    exit 1
fi

# Check if npm is installed
print_status "Checking npm installation..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm found: $NPM_VERSION"
else
    print_error "npm is not installed. Please install npm"
    exit 1
fi

# Check if Ionic CLI is installed
print_status "Checking Ionic CLI installation..."
if command -v ionic &> /dev/null; then
    IONIC_VERSION=$(ionic --version)
    print_success "Ionic CLI found: $IONIC_VERSION"
else
    print_status "Installing Ionic CLI globally..."
    npm install -g @ionic/cli
    if [ $? -eq 0 ]; then
        print_success "Ionic CLI installed successfully!"
    else
        print_error "Failed to install Ionic CLI"
        exit 1
    fi
fi

# Navigate to the ionic-app directory
print_status "Navigating to ionic-app directory..."
IONIC_APP_DIR="src/frontend/ionic-app"

if [ ! -d "$IONIC_APP_DIR" ]; then
    print_error "ionic-app directory not found at $IONIC_APP_DIR"
    print_error "Please run this script from the project root directory."
    exit 1
fi

cd "$IONIC_APP_DIR"

# Install project dependencies
print_status "Installing project dependencies..."
npm install

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully!"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Check if .env file exists
print_status "Checking environment configuration..."
if [ -f ".env" ]; then
    print_success ".env file found"
else
    print_status "Creating .env file..."
    cat > .env << EOF
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_WEBSOCKET_URL=ws://localhost:8000

# App Configuration
VITE_APP_NAME=Drowsiness Detector
VITE_APP_VERSION=1.0.0

# Development Configuration
VITE_DEV_MODE=true
EOF
    print_success ".env file created"
fi

# Verify installation
print_status "Verifying installation..."

# Check if ionic.config.json exists
if [ -f "ionic.config.json" ]; then
    print_success "Ionic configuration found"
else
    print_error "Ionic configuration missing"
fi

# Check if package.json exists
if [ -f "package.json" ]; then
    print_success "Package configuration found"
else
    print_error "Package configuration missing"
fi

# Test if the project can be built
print_status "Testing project build..."
npm run build > /dev/null 2>&1

if [ $? -eq 0 ]; then
    print_success "Project builds successfully!"
else
    print_warning "Build test failed. You may need to fix dependencies."
fi

# Final instructions
echo ""
echo "🎉 Installation Complete!"
echo "========================"
echo ""
print_success "Your Ionic React app is ready for development!"
echo ""
echo "📋 Next Steps:"
echo "   1. Navigate to the app directory:"
echo "      ${BLUE}cd src/frontend/ionic-app${NC}"
echo ""
echo "   2. Start the development server:"
echo "      ${BLUE}npm run dev${NC}  or  ${BLUE}ionic serve${NC}"
echo ""
echo "   3. Open your browser to:"
echo "      ${BLUE}http://localhost:8100${NC}"
echo ""
echo "   4. For mobile development, add platforms:"
echo "      ${BLUE}ionic capacitor add ios${NC}     # For iOS"
echo "      ${BLUE}ionic capacitor add android${NC} # For Android"
echo ""
echo "📚 Useful Commands:"
echo "   • ${BLUE}npm run build${NC}        - Build for production"
echo "   • ${BLUE}npm run test.unit${NC}    - Run unit tests"
echo "   • ${BLUE}npm run lint${NC}         - Run code linting"
echo "   • ${BLUE}ionic capacitor run ios${NC} - Run on iOS device"
echo ""
echo "🔗 Documentation:"
echo "   • Ionic React: https://ionicframework.com/docs/react"
echo "   • Capacitor: https://capacitorjs.com/docs"
echo ""
echo "Happy coding! 🚀"
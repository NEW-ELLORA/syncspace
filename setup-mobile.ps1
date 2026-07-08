cd syncspace-mobile

# 1. Install react and vite dependencies
npm install

# 2. Install tailwindcss and lucide-react (since we share UI)
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
npm install lucide-react framer-motion react-router-dom

# 3. Install Capacitor Core and Android
npm install @capacitor/core
npm install -D @capacitor/cli @capacitor/android

# 4. Initialize Capacitor
npx cap init syncspace.mobile com.syncspace.mobile --web-dir dist

# 5. Add Android Platform
npx cap add android

# 6. Copy Desktop CSS and tailwind.config
Copy-Item ..\tailwind.config.js .\tailwind.config.js -Force
Copy-Item ..\src\index.css .\src\index.css -Force

Write-Host "Mobile setup complete!"

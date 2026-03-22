# Building Chanitec as .exe

## Prerequisites
- Node.js and npm installed
- All dependencies installed (`npm install`)

## Steps to Build

1. **Install dependencies** (if not already installed):
   ```powershell
   npm install
   ```

2. **Build the React app and create .exe**:
   ```powershell
   npm run electron:build
   ```

   This will:
   - Build the React app (`npm run build`)
   - Package it into a Windows executable using Electron Builder
   - Create an installer in the `dist` folder

3. **Find your .exe**:
   - The built installer will be in: `chanitec-frontend-Myv/dist/`
   - Look for a file like: `Chanitec Setup X.X.X.exe`

## Development Mode

To test the Electron app in development:
```powershell
npm run electron:dev
```

## Production Testing

To test the built app locally (without creating installer):
```powershell
npm run electron:prod
```

## Notes
- The .exe will be an installer (NSIS installer)
- Users can choose installation directory
- Desktop and Start Menu shortcuts will be created
- The built app will be standalone and won't require Node.js on the target machine


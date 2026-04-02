const { app, BrowserWindow } = require('electron')
const path = require('path')

;(function warnIfElectronOutsideSupportedBand() {
  const raw = process.versions.electron
  if (raw == null || raw === '') return
  const major = parseInt(String(raw).split('.')[0] ?? '', 10)
  if (!Number.isFinite(major) || (major >= 39 && major <= 41)) return
  console.warn(
    `[SRS Flashcard] Electron major ${major} is outside the supported band (39–41).`,
  )
})()

const isDev = process.argv.includes('--dev') || process.env.ELECTRON_DEV === '1'

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 400,
    minHeight: 400,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'SRS Flashcard',
  })

  if (isDev) {
    win.loadURL('http://127.0.0.1:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  win.on('closed', () => {
    // no-op; allow window to close
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

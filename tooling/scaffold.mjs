import fs from 'fs'; import path from 'path';
const [,, appId, target, outDir] = process.argv;
if (!appId || !target || !outDir) { console.error('usage: scaffold.mjs <app> <android|electron> <outDir>'); process.exit(2); }
const root = process.cwd();
const appDir = path.join(root, 'apps', appId);
if (!fs.existsSync(appDir)) { console.error('app introuvable:', appDir); process.exit(1); }
const NAMES = { affaires:'FreeForge Affaires', dev:'FreeForge Dev', finances:'FreeForge Finances', etudes:'FreeForge Etudes', sante:'FreeForge Sante', studio:'FreeForge Studio', gamers:'FreeForge Gamers', quotidien:'FreeForge Quotidien', voyage:'FreeForge Voyage' };
const appName = NAMES[appId] || ('FreeForge ' + appId);
const bundle = 'ca.pgrg.freeforge.' + appId;
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(path.join(outDir, 'www'), { recursive: true });
function cp(src, dst) { for (const e of fs.readdirSync(src, { withFileTypes: true })) { const s = path.join(src, e.name), d = path.join(dst, e.name); if (e.isDirectory()) { fs.mkdirSync(d, { recursive: true }); cp(s, d); } else fs.copyFileSync(s, d); } }
cp(appDir, path.join(outDir, 'www'));
if (target === 'android') {
  fs.writeFileSync(path.join(outDir, 'capacitor.config.json'), JSON.stringify({ appId: bundle, appName, webDir: 'www', server: { androidScheme: 'https' } }, null, 2));
  fs.writeFileSync(path.join(outDir, 'package.json'), JSON.stringify({ name: 'ff-' + appId, version: '1.0.0', private: true, devDependencies: { '@capacitor/cli': '^6.1.2' }, dependencies: { '@capacitor/core': '^6.1.2', '@capacitor/android': '^6.1.2', '@capacitor/filesystem': '^6.0.0', '@capacitor/share': '^6.0.0' } }, null, 2));
} else {
  fs.writeFileSync(path.join(outDir, 'main.js'), "const{app,BrowserWindow}=require('electron');const path=require('path');function w(){const win=new BrowserWindow({width:1120,height:840,title:" + JSON.stringify(appName) + ",backgroundColor:'#0a3559',webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});win.setMenuBarVisibility(false);win.loadFile(path.join(__dirname,'www','index.html'));}app.whenReady().then(()=>{w();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)w();});});app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});");
  fs.writeFileSync(path.join(outDir, 'package.json'), JSON.stringify({ name: 'ff-' + appId, version: '1.0.0', description: appName, main: 'main.js', scripts: { dist: 'electron-builder' }, devDependencies: { electron: '^31.7.7', 'electron-builder': '^24.13.3' }, build: { appId: bundle, productName: appName, directories: { output: 'dist' }, files: ['main.js', 'www/**/*'], win: { target: 'nsis' }, mac: { target: 'dmg', category: 'public.app-category.productivity' }, linux: { target: 'AppImage', category: 'Utility' } } }, null, 2));
}
console.log('scaffolded', appId, target, '->', outDir);

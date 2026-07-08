const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)){
    fs.mkdirSync(distDir);
}

// Các file JS cần được làm rối (Obfuscate) để bảo mật
const jsFiles = ['popup.js', 'background.js'];
jsFiles.forEach(file => {
    const code = fs.readFileSync(path.join(__dirname, file), 'utf8');
    const obfuscated = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        stringArray: true,
        stringArrayEncoding: ['base64'],
        disableConsoleOutput: true
    });
    fs.writeFileSync(path.join(distDir, file), obfuscated.getObfuscatedCode());
    console.log(`Đã obfuscate: ${file}`);
});

// Các file không cần mã hóa chỉ việc copy sang thư mục dist
const copyFiles = ['manifest.json', 'popup.html'];
copyFiles.forEach(file => {
    fs.copyFileSync(path.join(__dirname, file), path.join(distDir, file));
    console.log(`Đã copy: ${file}`);
});

console.log("XONG! Extension của bạn đã được đóng gói an toàn trong thư mục 'dist/'. Bạn có thể nén thư mục này gửi cho khách.");

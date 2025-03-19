const fs = require('fs-extra');

// Copia la carpeta config/locals y sus archivos al directorio dist
fs.copySync('src/config/locales', 'dist/config/locales');

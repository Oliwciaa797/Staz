const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// To automatycznie serwuje WSZYSTKIE pliki z folderu (css, js, obrazki, inne strony)
app.use(express.static(path.join(__dirname, 'strona-startowa')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'strona-startowa', 'start.html'));
});

app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});


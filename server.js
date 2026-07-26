const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// Serwuj pliki statyczne z GŁÓWNEGO katalogu (bo tam leży main.css, toast.js itd.)
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'strona startowa', 'start.html'));
});

app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
const express = require('express');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3002;

function generateSampleData(size = 1000) {
  const data = [];
  for (let i = 0; i < size; i++) {
    data.push({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      description: `This is a sample description for user ${i}. It contains some repetitive text to make compression more effective. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
      timestamp: new Date().toISOString(),
      metadata: {
        active: i % 2 === 0,
        role: i % 3 === 0 ? 'admin' : 'user',
        score: Math.floor(Math.random() * 100)
      }
    });
  }
  return data;
}

app.get('/data/:size?', (req, res) => {
  const size = parseInt(req.params.size) || 1000;
  const data = generateSampleData(size);
  
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="data.zip"');
  
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });
  
  archive.on('error', (err) => {
    console.error('Archive error:', err);
    res.status(500).send('Error creating zip file');
  });
  
  archive.pipe(res);
  
  const jsonData = JSON.stringify(data, null, 2);
  const uncompressedSize = Buffer.byteLength(jsonData, 'utf8');
  console.log(`Generating sample data with ${size} records (uncompressed size: ${uncompressedSize} bytes)`);
  archive.append(jsonData, { name: 'data.json' });
  
  archive.finalize();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', compression: 'manual-zip' });
});

app.listen(PORT, () => {
  console.log(`Manual zip server running on port ${PORT}`);
});
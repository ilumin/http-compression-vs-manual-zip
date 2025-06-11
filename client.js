const axios = require('axios');

async function measureHttpCompression(url, encodingType = 'all') {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let compressedSize = 0;
    let chunks = [];
    
    const http = require('http');
    const zlib = require('zlib');
    const urlObj = new URL(url);
    
    // Set Accept-Encoding based on type
    let acceptEncoding;
    let label;
    switch (encodingType) {
      case 'all':
        acceptEncoding = 'gzip, deflate, br';
        label = 'HTTP Compression (All)';
        break;
      case 'gzip':
        acceptEncoding = 'gzip';
        label = 'HTTP Compression (Gzip)';
        break;
      case 'deflate':
        acceptEncoding = 'deflate';
        label = 'HTTP Compression (Deflate)';
        break;
      case 'br':
        acceptEncoding = 'br';
        label = 'HTTP Compression (Brotli)';
        break;
      default:
        acceptEncoding = 'gzip, deflate, br';
        label = 'HTTP Compression (All)';
    }
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Accept-Encoding': acceptEncoding,
        'Accept': 'application/json',
        'User-Agent': 'Node.js HTTP Client'
      }
    };
    
    const req = http.request(options, (res) => {
      res.on('data', (chunk) => {
        compressedSize += chunk.length;
        chunks.push(chunk);
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const compressedBuffer = Buffer.concat(chunks);
        
        // Decompress based on encoding
        let uncompressedData;
        const encoding = res.headers['content-encoding'];
        
        try {
          if (encoding === 'gzip') {
            uncompressedData = zlib.gunzipSync(compressedBuffer).toString();
          } else if (encoding === 'deflate') {
            uncompressedData = zlib.inflateSync(compressedBuffer).toString();
          } else if (encoding === 'br') {
            uncompressedData = zlib.brotliDecompressSync(compressedBuffer).toString();
          } else {
            uncompressedData = compressedBuffer.toString();
          }
        } catch (err) {
          console.error('Decompression error:', err.message);
          uncompressedData = compressedBuffer.toString();
        }
        
        const uncompressedSize = Buffer.byteLength(uncompressedData, 'utf8');
        
        resolve({
          label: label,
          transferSize: compressedSize,
          uncompressedSize: uncompressedSize,
          duration: endTime - startTime,
          contentLength: res.headers['content-length'],
          contentEncoding: res.headers['content-encoding'],
          contentType: res.headers['content-type'],
          encodingType: encodingType
        });
      });
    });
    
    req.on('error', (error) => {
      console.error(`Error measuring HTTP compression (${encodingType}):`, error.message);
      resolve(null);
    });
    
    req.end();
  });
}

async function measureManualZip(url) {
  try {
    const startTime = Date.now();
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'application/zip'
      }
    });
    const endTime = Date.now();
    
    return {
      label: 'Manual ZIP',
      transferSize: response.data.byteLength,
      duration: endTime - startTime,
      contentLength: response.headers['content-length'],
      contentEncoding: response.headers['content-encoding'] || 'none',
      contentType: response.headers['content-type']
    };
  } catch (error) {
    console.error('Error measuring manual ZIP:', error.message);
    return null;
  }
}

async function runComparison(dataSize = 1000) {
  console.log(`\n=== Comparing transfer sizes for ${dataSize} records ===`);
  
  const compressionUrl = `http://localhost:3001/data/${dataSize}`;
  const zipUrl = `http://localhost:3002/data/${dataSize}`;
  
  // Test all 4 HTTP compression types
  console.log('Measuring HTTP compression (All encodings)...');
  const compressionAllResult = await measureHttpCompression(compressionUrl, 'all');
  
  console.log('Measuring HTTP compression (Gzip)...');
  const compressionGzipResult = await measureHttpCompression(compressionUrl, 'gzip');
  
  console.log('Measuring HTTP compression (Deflate)...');
  const compressionDeflateResult = await measureHttpCompression(compressionUrl, 'deflate');
  
  console.log('Measuring HTTP compression (Brotli)...');
  const compressionBrResult = await measureHttpCompression(compressionUrl, 'br');
  
  console.log('Measuring manual zip...');
  const zipResult = await measureManualZip(zipUrl);
  
  const compressionResults = [
    compressionAllResult,
    compressionGzipResult, 
    compressionDeflateResult,
    compressionBrResult
  ].filter(result => result !== null);
  
  if (compressionResults.length > 0 && zipResult) {
    console.log('\n--- Results ---');
    
    // Display all HTTP compression results
    compressionResults.forEach(result => {
      console.log(`\n${result.label}:`);
      console.log(`  Transfer Size: ${result.transferSize.toLocaleString()} bytes`);
      console.log(`  Uncompressed Size: ${result.uncompressedSize.toLocaleString()} bytes`);
      console.log(`  Compression Ratio: ${((1 - result.transferSize / result.uncompressedSize) * 100).toFixed(2)}%`);
      console.log(`  Duration: ${result.duration}ms`);
      console.log(`  Content-Encoding: ${result.contentEncoding || 'none'}`);
      console.log(`  Content-Type: ${result.contentType}`);
    });
    
    console.log(`\nManual ZIP:`);
    console.log(`  Transfer Size: ${zipResult.transferSize.toLocaleString()} bytes`);
    console.log(`  Duration: ${zipResult.duration}ms`);
    console.log(`  Content-Type: ${zipResult.contentType}`);
    
    console.log(`\n--- Comparison Summary ---`);
    console.log('Method\t\t\tTransfer Size\tCompression Ratio\tDuration');
    console.log('-'.repeat(80));
    
    compressionResults.forEach(result => {
      const ratio = ((1 - result.transferSize / result.uncompressedSize) * 100).toFixed(2);
      console.log(`${result.label.padEnd(24)}\t${result.transferSize.toLocaleString().padStart(8)} bytes\t${ratio.padStart(8)}%\t\t${result.duration}ms`);
    });
    
    const zipRatio = zipResult.uncompressedSize ? 
      ((1 - zipResult.transferSize / zipResult.uncompressedSize) * 100).toFixed(2) : 'N/A';
    console.log(`Manual ZIP\t\t${zipResult.transferSize.toLocaleString().padStart(8)} bytes\t${zipRatio.toString().padStart(8)}%\t\t${zipResult.duration}ms`);
    
    // Find best compression
    const allResults = [...compressionResults, zipResult];
    const bestResult = allResults.reduce((best, current) => 
      current.transferSize < best.transferSize ? current : best
    );
    
    console.log(`\nBest compression: ${bestResult.label || 'Manual ZIP'} with ${bestResult.transferSize.toLocaleString()} bytes`);
    
    return {
      compressions: compressionResults,
      zip: zipResult,
      best: bestResult
    };
  }
  
  return null;
}

async function runBenchmark() {
  const sizes = [100, 500, 1000, 5000, 10000];
  const results = [];
  
  console.log('Starting benchmark...');
  
  for (const size of sizes) {
    const result = await runComparison(size);
    if (result) {
      results.push({ size, ...result });
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n=== Benchmark Summary ===');
  console.log('Size\t\tHTTP Comp\tManual ZIP\tDifference\tWinner');
  console.log('-'.repeat(70));
  
  results.forEach(result => {
    const winner = result.sizeDifference > 0 ? 'Manual ZIP' : 'HTTP Comp';
    console.log(`${result.size}\t\t${result.compression.transferSize}\t\t${result.zip.transferSize}\t\t${result.percentageDifference}%\t\t${winner}`);
  });
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'benchmark') {
    runBenchmark();
  } else {
    const size = parseInt(args[0]) || 1000;
    runComparison(size);
  }
}

module.exports = { runComparison, runBenchmark };
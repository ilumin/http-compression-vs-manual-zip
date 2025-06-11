const axios = require('axios');

async function measureTransferSize(url, label) {
  try {
    const startTime = Date.now();
    const response = await axios.get(url, {
      responseType: 'arraybuffer'
    });
    const endTime = Date.now();
    
    const transferSize = response.data.byteLength;
    const duration = endTime - startTime;
    
    return {
      label,
      transferSize,
      duration,
      contentLength: response.headers['content-length'],
      contentEncoding: response.headers['content-encoding'],
      contentType: response.headers['content-type']
    };
  } catch (error) {
    console.error(`Error measuring ${label}:`, error.message);
    return null;
  }
}

async function runComparison(dataSize = 1000) {
  console.log(`\n=== Comparing transfer sizes for ${dataSize} records ===`);
  
  const compressionUrl = `http://localhost:3001/data/${dataSize}`;
  const zipUrl = `http://localhost:3002/data/${dataSize}`;
  
  console.log('Measuring HTTP compression...');
  const compressionResult = await measureTransferSize(compressionUrl, 'HTTP Compression');
  
  console.log('Measuring manual zip...');
  const zipResult = await measureTransferSize(zipUrl, 'Manual ZIP');
  
  if (compressionResult && zipResult) {
    console.log('\n--- Results ---');
    console.log(`HTTP Compression:`);
    console.log(`  Transfer Size: ${compressionResult.transferSize.toLocaleString()} bytes`);
    console.log(`  Duration: ${compressionResult.duration}ms`);
    console.log(`  Content-Encoding: ${compressionResult.contentEncoding || 'none'}`);
    console.log(`  Content-Type: ${compressionResult.contentType}`);
    
    console.log(`\nManual ZIP:`);
    console.log(`  Transfer Size: ${zipResult.transferSize.toLocaleString()} bytes`);
    console.log(`  Duration: ${zipResult.duration}ms`);
    console.log(`  Content-Type: ${zipResult.contentType}`);
    
    const sizeDifference = compressionResult.transferSize - zipResult.transferSize;
    const percentageDifference = ((sizeDifference / compressionResult.transferSize) * 100).toFixed(2);
    
    console.log(`\n--- Comparison ---`);
    console.log(`Size difference: ${sizeDifference.toLocaleString()} bytes`);
    console.log(`Percentage difference: ${percentageDifference}%`);
    
    if (sizeDifference > 0) {
      console.log(`Manual ZIP is ${Math.abs(percentageDifference)}% smaller`);
    } else {
      console.log(`HTTP Compression is ${Math.abs(percentageDifference)}% smaller`);
    }
    
    const timeDifference = compressionResult.duration - zipResult.duration;
    console.log(`Time difference: ${timeDifference}ms`);
    
    return {
      compression: compressionResult,
      zip: zipResult,
      sizeDifference,
      percentageDifference: parseFloat(percentageDifference),
      timeDifference
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
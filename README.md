# HTTP Compression vs Manual ZIP Comparison

This project compares the transfer size efficiency between HTTP compression (gzip) and manually zipping responses.

## Setup

1. Install dependencies:
```bash
npm install
```

## Usage

### Start servers (in separate terminals):

1. Start HTTP compression server:
```bash
npm run compression-server
```

2. Start manual ZIP server:
```bash
npm run zip-server
```

### Run tests:

1. Single comparison (default 1000 records):
```bash
npm test
```

2. Custom record count:
```bash
node client.js 5000
```

3. Full benchmark across multiple sizes:
```bash
node client.js benchmark
```

## Servers

- **Compression Server** (port 3001): Uses Express with compression middleware
- **ZIP Server** (port 3002): Manually creates ZIP files with archiver

## Endpoints

- `GET /data/:size` - Returns sample data (size defaults to 1000)
- `GET /health` - Health check

## Sample Output

```
=== Comparing transfer sizes for 1000 records ===
HTTP Compression:
  Transfer Size: 15,234 bytes
  Duration: 45ms
  Content-Encoding: gzip

Manual ZIP:
  Transfer Size: 12,890 bytes
  Duration: 78ms
  Content-Type: application/zip

--- Comparison ---
Size difference: 2,344 bytes
Percentage difference: 15.38%
Manual ZIP is 15.38% smaller
```
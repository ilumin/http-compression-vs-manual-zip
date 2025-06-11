# HTTP Compression vs Manual ZIP Comparison

This project compares the transfer size efficiency between HTTP compression (gzip) and manually zipping responses.

## Why Compare?

ผมเป็นคนขี้เกียจ ผมไม่เคยทำ zip เพื่อ response กลับไปหา client (แต่เคยทำ encrption เพื่อให้ content มันเล็กลงแล้วค่อยส่ง) พอมาเจอคนแนะนำว่าควรจะทำ zip แล้วส่งกลับไปให้ client เลยเกิดคำถามว่าเอ๊ะ แล้วที่เราใช้ๆมาตลอด (HTTP compression) มันดีกว่าไหม? หรือ manual zip มันดีกว่า? โปรเจคนี้เลยเกิดขึ้นมาเพื่อเปรียบเทียบการส่งข้อมูลระหว่าง HTTP compression กับ manual ZIP response

## Overview

โปรเจคนี้จะแบ่งออกเป็น 3 ส่วนหลัก:
1. **Compression Server**: ใช้ Express กับ middleware compression เพื่อส่งข้อมูลที่ถูกบีบอัดด้วย gzip
2. **Manual ZIP Server**: ใช้ Express กับ archiver เพื่อสร้างไฟล์ ZIP ด้วยข้อมูลที่ส่งกลับ
3. **Client**: เรียก API ทั้งสองและเปรียบเทียบขนาดการส่งข้อมูล โดยจะเรียกทั้ง HTTP compression และ manual ZIP สำหรับ HTTP compression จะทดสอบทั้ง 4 ประเภท (gzip, deflate, br, all) เพื่อดูว่าประสิทธิภาพเป็นอย่างไร

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
# 🇹🇭 thai-id-electron

![License](https://img.shields.io/badge/license-MIT-green)
![Node.js >=16](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)
![Electron](https://img.shields.io/badge/electron-^35.1.5-blue)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)

`thai-id-electron` is a local API application built with Electron for reading data from Thai national ID cards via smart card readers. It is designed to run directly on client machines and returns structured citizen information in JSON format.

## Table of Contents

- [🇹🇭 thai-id-electron](#-thai-id-electron)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Getting Started](#getting-started)
    - [Installation](#installation)
    - [Run in Development](#run-in-development)
    - [Build for Production](#build-for-production)
  - [API Endpoint](#api-endpoint)
      - [Response:](#response)
  - [Frontend Integration Example](#frontend-integration-example)
  - [Project Structure](#project-structure)
  - [Notes](#notes)
  - [License](#license)

## Features

- Read Thai national ID card data using PC/SC-compatible smart card readers
- Run as a local API server on the client’s machine
- Response includes full name (Thai & English), address, CID, birthdate, issue/expiry date, and gender
- Easy to run in development or build for production

## Getting Started

### Installation

```bash
npm install
```

### Run in Development

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

## API Endpoint

This Electron app exposes a single HTTP GET endpoint:

`GET /api/read-id-card`
Reads data from a Thai national ID card inserted into a smart card reader connected to the machine.

#### Response:

```json
{
  "success": true,
  "data": {
    "cid": "1234567890123",
    "fullNameThai": {
      "title": "นาย",
      "firstname": "สมชาย",
      "lastname": "ใจดี"
    },
    "fullNameEng": {
      "title": "Mr.",
      "firstname": "Somchai",
      "lastname": "Jaidee"
    },
    "gender": "ชาย",
    "birthDate": "01 Jan 2540",
    "issueDate": "15 Mar 2565",
    "expiryDate": "15 Mar 2575",
    "address": {
      "houseNo": "99/1",
      "moo": "5",
      "soi": "สุขสบาย 10",
      "road": "พหลโยธิน",
      "subDistrict": "ลาดยาว",
      "district": "จตุจักร",
      "province": "กรุงเทพมหานคร",
      "postcode": "10900"
    }
  }
}
```
If reading fails or no card is inserted within 30 seconds, you'll receive:

```json
{
  "success": false,
  "message": "ยังไม่ได้เสียบบัตร"
}
```

## Frontend Integration Example

Example usage in a Vue frontend app:

```ts
async function handleReadIdCard (): Promise<void> {
  isLoading.value = true
  try {
    const response = await fetch('http://localhost:5001/api/read-id-card')
    const data = await response.json()
    if (data.success) {
      console.log('✅ ID Card Data:', data.data)
      emit('read-id-card-success', data.data)
    } else {
      console.error('❌ Failed to read card:', data.message)
    }
  } catch (error) {
    console.error('❌ Error reading card:', error)
  } finally {
    isLoading.value = false
  }
}
```

## Project Structure

| File         | Description                                       |
|--------------|---------------------------------------------------|
| `main.js`    | Express server that exposes the API               |
| `reader.js`  | PCSC logic for detecting and reading card         |
| `handlers.js`| Maps APDU commands to readable data               |
| `apdu.js`    | Thai ID card APDU command definitions             |
| `utils.js`   | Thai decoding, address parsing, date formatting   |
| `preload.js` | Electron preload script for frontend communication|

## Notes

- A compatible Thai national ID card reader and proper driver installation are required.
- This tool works only on systems that support Electron and Node.js with access to PC/SC APIs (e.g. Windows/macOS/Linux with drivers).
- Recommended to use with backend apps or frontend desktop interfaces requiring Thai ID card input

## License
MIT © 2024 Chawit Tanachochaow



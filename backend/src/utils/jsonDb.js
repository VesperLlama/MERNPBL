// /**
//  * jsonDb.js
//  * Safe JSON "DB" helpers: readJson, writeJson, getNextId, atomicUpdate (file-level mutex)
//  *
//  * Usage:
//  *  const { readJson, writeJson, getNextId, atomicUpdate } = require('./jsonDb');
//  *
//  * atomicUpdate(fileName, async (data) => {
//  *    // modify data and return new array/object to be written
//  * });
//  */

// const fs = require('fs');
// const path = require('path');

// const dataDir = path.join(__dirname, '../../data');

// // ensure data directory exists
// if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// // Simple in-memory locks per-file (JS-level mutex). Good for single-process server.
// const locks = new Map();

// function _fullPath(fileName) {
//   // accept fileName with or without .json
//   if (!fileName.endsWith('.json')) fileName = `${fileName}.json`;
//   return path.join(dataDir, fileName);
// }

// function readJson(fileName) {
//   const full = _fullPath(fileName);
//   if (!fs.existsSync(full)) {
//     // create default empty array file
//     fs.writeFileSync(full, JSON.stringify([]), 'utf8');
//   }
//   const raw = fs.readFileSync(full, 'utf8');
//   try {
//     return JSON.parse(raw || '[]');
//   } catch (err) {
//     // If JSON corrupted, throw with helpful message
//     throw new Error(`Failed to parse JSON file ${full}: ${err.message}`);
//   }
// }

// function writeJson(fileName, data) {
//   const full = _fullPath(fileName);
//   fs.writeFileSync(full, JSON.stringify(data, null, 2), 'utf8');
// }

// /**
//  * Acquire lock for key (fileName); waits until lock available.
//  * Very small busy-wait with setImmediate to avoid blocking.
//  */
// async function _acquireLock(key) {
//   while (locks.get(key)) {
//     // wait a tick
//     await new Promise((res) => setImmediate(res));
//   }
//   locks.set(key, true);
// }

// function _releaseLock(key) {
//   locks.set(key, false);
// }

// /**
//  * atomicUpdate(fileName, updater)
//  * - fileName: e.g. 'customers.json' or 'customers'
//  * - updater: function(currentData) -> newData (may be async)
//  *
//  * Ensures read-modify-write is atomic relative to other atomicUpdate calls
//  */
// async function atomicUpdate(fileName, updater) {
//   const key = `lock_${fileName}`;
//   await _acquireLock(key);
//   try {
//     const full = _fullPath(fileName);
//     if (!fs.existsSync(full)) fs.writeFileSync(full, JSON.stringify([]), 'utf8');

//     const raw = fs.readFileSync(full, 'utf8');
//     let data;
//     try { data = JSON.parse(raw || '[]'); } catch (err) { data = []; }
//     const newData = await updater(data);
//     // Validate returned type: must be an Array or Object
//     if (typeof newData !== 'object') {
//       throw new Error('atomicUpdate updater must return an object or array');
//     }
//     fs.writeFileSync(full, JSON.stringify(newData, null, 2), 'utf8');
//     return newData;
//   } finally {
//     _releaseLock(key);
//   }
// }

// /**
//  * getNextId(keyName)
//  * - keyName: one of keys stored in meta.json (customerId, adminId, carrierId, flightId, bookingId)
//  * returns integer new id
//  *
//  * Implementation uses atomic update on meta.json to be safe.
//  */
// async function getNextId(keyName) {
//   const metaFile = 'meta.json';
//   await atomicUpdate(metaFile, (meta) => {
//     if (!meta || Object.prototype.toString.call(meta) !== '[object Object]') {
//       meta = {};
//     }
//     if (!meta[keyName]) meta[keyName] = 0;
//     meta[keyName] = Number(meta[keyName]) + 1;
//     return meta;
//   });
//   // read back value
//   const meta = readJson(metaFile);
//   return meta[keyName];
// }

// module.exports = {
//   dataDir,
//   readJson,
//   writeJson,
//   atomicUpdate,
//   getNextId
// };


/**
 * jsonDb.js (Simplified Version)
 * Provides very simple JSON read/write helpers.
 * No mutex, no atomicUpdate, no locking.
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');

// Ensure data folder exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create full path for fileName
function _fullPath(fileName) {
  if (!fileName.endsWith('.json')) fileName += '.json';
  return path.join(dataDir, fileName);
}

// Simple read
function readJson(fileName) {
  const full = _fullPath(fileName);

  try {
    if (!fs.existsSync(full)) {
      fs.writeFileSync(full, JSON.stringify([]), 'utf8');
      return [];
    }

    const raw = fs.readFileSync(full, 'utf8');
    return JSON.parse(raw || '[]');

  } catch (err) {
    console.error(`Error reading JSON file: ${full}`, err);
    return [];
  }
}

// Simple write
function writeJson(fileName, data) {
  const full = _fullPath(fileName);

  try {
    fs.writeFileSync(full, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing JSON file: ${full}`, err);
  }
}

// Auto-increment ID (simple version)
function getNextId(keyName) {
  const metaFile = 'meta.json';
  let meta = readJson(metaFile);

  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    meta = {};
  }

  if (!meta[keyName]) meta[keyName] = 0;
  meta[keyName]++;

  writeJson(metaFile, meta);

  return meta[keyName];
}

module.exports = {
  dataDir,
  readJson,
  writeJson,
  getNextId
};
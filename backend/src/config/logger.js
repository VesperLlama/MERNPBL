/**
 * Minimal logger - wraps console for consistency
 */

function info(...args) {
  console.log('[INFO]', ...args);
}
function warn(...args) {
  console.warn('[WARN]', ...args);
}
function error(...args) {
  console.error('[ERR]', ...args);
}

module.exports = { info, warn, error };

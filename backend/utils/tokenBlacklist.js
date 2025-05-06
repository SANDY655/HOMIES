const blacklist = new Set();
function add(token) {
  blacklist.add(token);
}
function isBlacklisted(token) {
  return blacklist.has(token);
}
module.exports = { add, isBlacklisted };

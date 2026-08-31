const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/ai-asesment-db'); // Let me check if this is the correct DB URI in .env.local
  // Actually I shouldn't hardcode it. Let me read from .env.local first.
}

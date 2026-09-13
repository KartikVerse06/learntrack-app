const fs = require("fs");
const path = require("path");

const soundDir = path.join(__dirname, "..", "public", "sounds");
fs.mkdirSync(soundDir, { recursive: true });

function createWav(frequencies, durationSec, sampleRate = 44100) {
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * 2; // 16-bit = 2 bytes per sample
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF chunk descriptor
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  // fmt sub-chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // subchunk1size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // audioFormat (1 = PCM)
  buffer.writeUInt16LE(1, 22); // numChannels (1 = mono)
  buffer.writeUInt32LE(sampleRate, 24); // sampleRate
  buffer.writeUInt32LE(sampleRate * 2, 28); // byteRate (sampleRate * numChannels * bitsPerSample/8)
  buffer.writeUInt16LE(2, 32); // blockAlign
  buffer.writeUInt16LE(16, 34); // bitsPerSample

  // data sub-chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Exponential decay envelope
    const envelope = Math.exp(-3 * (t / durationSec));
    let sampleVal = 0;

    for (const { freq, weight } of frequencies) {
      sampleVal += Math.sin(2 * Math.PI * freq * t) * weight;
    }

    // Scale to 16-bit signed integer [-32768, 32767]
    const clamped = Math.max(-1, Math.min(1, sampleVal * envelope * 0.7));
    const int16 = Math.floor(clamped * 32767);
    buffer.writeInt16LE(int16, offset);
    offset += 2;
  }

  return buffer;
}

// 1. Bell: Bright dual-tone meditation chime (A5 880Hz + E6 1318Hz)
const bellWav = createWav([
  { freq: 880, weight: 0.6 },
  { freq: 1320, weight: 0.4 },
  { freq: 1760, weight: 0.15 },
], 2.5);

// 2. Bowl: Resonant singing bowl (F4 349Hz + harmonic C5 523Hz)
const bowlWav = createWav([
  { freq: 349.23, weight: 0.7 },
  { freq: 523.25, weight: 0.4 },
  { freq: 698.46, weight: 0.2 },
], 3.0);

// 3. Gong: Deep calming gong (C3 130.8Hz + G3 196Hz)
const gongWav = createWav([
  { freq: 130.81, weight: 0.8 },
  { freq: 196.0, weight: 0.4 },
  { freq: 261.63, weight: 0.2 },
], 3.5);

fs.writeFileSync(path.join(soundDir, "chime-bell.wav"), bellWav);
fs.writeFileSync(path.join(soundDir, "chime-bowl.wav"), bowlWav);
fs.writeFileSync(path.join(soundDir, "chime-gong.wav"), gongWav);

// Also provide .mp3 aliases for broad compatibility
fs.writeFileSync(path.join(soundDir, "chime-bell.mp3"), bellWav);
fs.writeFileSync(path.join(soundDir, "chime-bowl.mp3"), bowlWav);
fs.writeFileSync(path.join(soundDir, "chime-gong.mp3"), gongWav);

console.log("Audio chimes successfully generated in public/sounds/");

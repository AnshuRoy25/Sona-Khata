// Records the microphone and returns a WAV file.
// Browsers record WebM by default, which Prisma does not accept,
// so we take the raw samples ourselves and write a 16 kHz mono WAV.

const TARGET_RATE = 16000;

export async function startRecording(onLevel) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("This browser cannot record audio.");
  }

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });
  } catch (err) {
    throw new Error("Microphone access was blocked. Allow it in the browser and try again.");
  }

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const context = new AudioCtx();
  const source = context.createMediaStreamSource(stream);
  const processor = context.createScriptProcessor(4096, 1, 1);
  const chunks = [];

  processor.onaudioprocess = function (event) {
    const input = event.inputBuffer.getChannelData(0);
    chunks.push(new Float32Array(input));

    if (onLevel) {
      let sum = 0;
      for (let i = 0; i < input.length; i++) {
        sum = sum + input[i] * input[i];
      }
      const rms = Math.sqrt(sum / input.length);
      onLevel(Math.min(1, rms * 6));
    }
  };

  source.connect(processor);
  processor.connect(context.destination);

  function release() {
    processor.disconnect();
    source.disconnect();
    const tracks = stream.getTracks();
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].stop();
    }
    context.close();
  }

  return {
    // stop and get the WAV file
    stop: function () {
      release();
      const samples = joinChunks(chunks);
      const resampled = downsample(samples, context.sampleRate, TARGET_RATE);
      return encodeWav(resampled, TARGET_RATE);
    },
    // stop and throw the audio away
    cancel: function () {
      release();
    },
  };
}

function joinChunks(chunks) {
  let length = 0;
  for (let i = 0; i < chunks.length; i++) {
    length = length + chunks[i].length;
  }

  const result = new Float32Array(length);
  let offset = 0;
  for (let i = 0; i < chunks.length; i++) {
    result.set(chunks[i], offset);
    offset = offset + chunks[i].length;
  }
  return result;
}

// averages groups of samples to go from e.g. 48000 Hz to 16000 Hz
function downsample(samples, fromRate, toRate) {
  if (fromRate === toRate) return samples;

  const ratio = fromRate / toRate;
  const newLength = Math.floor(samples.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), samples.length);
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum = sum + samples[j];
    }
    result[i] = sum / Math.max(1, end - start);
  }
  return result;
}

// 16-bit PCM WAV
function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeText(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeText(view, 8, "WAVE");
  writeText(view, 12, "fmt ");
  view.setUint32(16, 16, true); // header chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // bytes per second
  view.setUint16(32, 2, true); // bytes per sample
  view.setUint16(34, 16, true); // bits per sample
  writeText(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset = offset + 2;
  }

  return new Blob([view], { type: "audio/wav" });
}

function writeText(view, offset, text) {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

// Generated ambient sound: rain (filtered noise) or lofi (soft chord pad + vinyl crackle).
export function startAmbient(kind: "rain" | "lofi") {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0.35;
  master.connect(ctx.destination);

  const noise = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
  const d = noise.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    last = kind === "rain" ? (last + 0.02 * w) / 1.02 : w;
    d[i] = kind === "rain" ? last * 3.5 : Math.random() < 0.0006 ? w : w * 0.004;
  }
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = kind === "rain" ? "lowpass" : "highpass";
  filter.frequency.value = kind === "rain" ? 1200 : 3000;
  src.connect(filter).connect(master);
  src.start();

  let timer: ReturnType<typeof setInterval> | undefined;
  if (kind === "lofi") {
    const chords = [[220, 261.6, 329.6, 392], [174.6, 220, 261.6, 329.6], [196, 246.9, 293.7, 349.2], [164.8, 207.7, 246.9, 329.6]];
    let step = 0;
    const play = () => {
      const t = ctx.currentTime;
      chords[step++ % chords.length].forEach((f) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        const lp = ctx.createBiquadFilter();
        o.type = "triangle";
        o.frequency.value = f;
        lp.frequency.value = 900;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.06, t + 0.4);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 3.8);
        o.connect(lp).connect(g).connect(master);
        o.start(t);
        o.stop(t + 4);
      });
    };
    play();
    timer = setInterval(play, 4000);
  }
  return () => {
    clearInterval(timer);
    ctx.close();
  };
}

(() => {
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', () => {
    initParticles({ reduced: prefersReduced });
    initParallax({ reduced: prefersReduced });
    initForm();
    initMicroInteractions({ reduced: prefersReduced });
  });

  // ------------------------ Particles + Noise ------------------------
  function initParticles({ reduced }) {
    const particlesCanvas = document.getElementById('particles-canvas');
    const noiseCanvas = document.getElementById('noise-canvas');
    if (!particlesCanvas || !noiseCanvas) return;

    const pr = Math.min(2, window.devicePixelRatio || 1);

    // Noise - static, subtle
    const drawNoise = () => {
      const w = Math.floor(window.innerWidth / 2);
      const h = Math.floor(window.innerHeight / 2);
      noiseCanvas.width = w;
      noiseCanvas.height = h;
      const ctx = noiseCanvas.getContext('2d', { alpha: true });
      const imgData = ctx.createImageData(w, h);
      // Sparse noise for performance
      for (let i = 0; i < imgData.data.length; i += 4) {
        const r = Math.random();
        const v = r < 0.1 ? Math.floor(200 + Math.random() * 55) : 0; // 10% sparse specks
        imgData.data[i] = v;
        imgData.data[i + 1] = v;
        imgData.data[i + 2] = v;
        imgData.data[i + 3] = v ? Math.floor(10 + Math.random() * 20) : 0; // very low alpha
      }
      ctx.putImageData(imgData, 0, 0);
      // Scale to full by CSS; no further updates
      noiseCanvas.style.width = '100%';
      noiseCanvas.style.height = '100%';
    };

    drawNoise();
    window.addEventListener('resize', debounce(drawNoise, 300));

    if (reduced) return; // Respect reduced motion: no particles

    // Particles
    const ctx = particlesCanvas.getContext('2d');
    let width, height;
    const resize = () => {
      width = particlesCanvas.width = Math.floor(window.innerWidth * pr);
      height = particlesCanvas.height = Math.floor(window.innerHeight * pr);
      particlesCanvas.style.width = '100%';
      particlesCanvas.style.height = '100%';
    };
    resize();
    window.addEventListener('resize', debounce(resize, 150));

    const area = () => (window.innerWidth * window.innerHeight);
    const baseCount = Math.max(24, Math.min(90, Math.floor(area() / 14000))); // adaptive

    let particles = createParticles(baseCount);
    let running = true;

    // Parallax influence from pointer
    const parallax = { x: 0, y: 0, targetX: 0, targetY: 0 };
    window.addEventListener('pointermove', (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      parallax.targetX = (e.clientX - cx) / cx; // -1..1
      parallax.targetY = (e.clientY - cy) / cy; // -1..1
    }, { passive: true });

    let rafId = 0;
    let last = performance.now();
    let frames = 0; let lastCheck = last; let fps = 60;

    function loop(now) {
      if (!running) return;
      rafId = requestAnimationFrame(loop);
      const dt = Math.min(50, now - last);
      last = now;
      frames++;

      // FPS sampling each 800ms
      if (now - lastCheck > 800) {
        fps = Math.round(frames * 1000 / (now - lastCheck));
        lastCheck = now; frames = 0;
        if (fps < 32 && particles.length > 20) {
          // degrade: halve particles
          particles = particles.slice(0, Math.max(18, Math.floor(particles.length * 0.7)));
        } else if (fps < 22) {
          running = false; cancelAnimationFrame(rafId);
          return;
        }
      }

      // Smooth parallax easing
      parallax.x += (parallax.targetX - parallax.x) * 0.04;
      parallax.y += (parallax.targetY - parallax.y) * 0.04;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        // move
        p.x += p.vx * dt * p.speed;
        p.y += p.vy * dt * p.speed;
        p.life += dt;
        // wrap
        if (p.x < -p.r) p.x = width + p.r;
        if (p.x > width + p.r) p.x = -p.r;
        if (p.y < -p.r) p.y = height + p.r;
        if (p.y > height + p.r) p.y = -p.r;

        // render (parallax based on depth)
        const px = p.x + parallax.x * p.depth * 20;
        const py = p.y + parallax.y * p.depth * 20;

        const g = ctx.createRadialGradient(px, py, 0, px, py, p.r * 2);
        g.addColorStop(0, `rgba(${p.c.r},${p.c.g},${p.c.b},${p.alpha})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, p.r * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function createParticles(n) {
      const arr = [];
      for (let i = 0; i < n; i++) {
        const r = rnd(0.6, 1.8) * pr;
        const angle = rnd(0, Math.PI * 2);
        const speed = rnd(0.010, 0.025);
        const vx = Math.cos(angle);
        const vy = Math.sin(angle);
        // bluish purple hue
        const blend = Math.random();
        const c = blend < 0.5
          ? { r: 100 + rndi(0, 60), g: 150 + rndi(0, 80), b: 255 }
          : { r: 150 + rndi(0, 70), g: 120 + rndi(0, 60), b: 255 };
        arr.push({
          x: Math.random() * Math.max(1, window.innerWidth) * pr,
          y: Math.random() * Math.max(1, window.innerHeight) * pr,
          vx, vy, speed, r, life: 0,
          depth: rnd(0.3, 1.2),
          alpha: rnd(0.05, 0.18),
          c
        });
      }
      return arr;
    }

    const onVis = () => {
      if (document.hidden) {
        running = false; cancelAnimationFrame(rafId);
      } else if (!prefersReduced) {
        if (!running) { running = true; last = performance.now(); lastCheck = last; frames = 0; rafId = requestAnimationFrame(loop); }
      }
    };
    document.addEventListener('visibilitychange', onVis);

    rafId = requestAnimationFrame(loop);
  }

  // ------------------------ Parallax ------------------------
  function initParallax({ reduced }) {
    const nodes = [...document.querySelectorAll('.parallax')];
    if (!nodes.length || reduced) return;

    const max = 12; // px
    const state = { x: 0, y: 0, tx: 0, ty: 0 };

    const onMove = (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      state.tx = (e.clientX - cx) / cx; // -1..1
      state.ty = (e.clientY - cy) / cy;
      schedule();
    };

    let raf = 0;
    const schedule = () => {
      if (raf) return; raf = requestAnimationFrame(apply);
    };
    const apply = () => {
      raf = 0;
      state.x += (state.tx - state.x) * 0.08;
      state.y += (state.ty - state.y) * 0.08;
      nodes.forEach((el) => {
        const d = parseFloat(el.getAttribute('data-depth') || '0.1');
        const dx = clamp(-max, max, state.x * max * d);
        const dy = clamp(-max, max, state.y * max * d);
        el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
  }

  // ------------------------ Form & Submission ------------------------
  function initForm() {
    const form = document.getElementById('loginForm');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const status = document.getElementById('status');
    const progressBar = document.getElementById('progressBar');
    const btn = document.getElementById('submitBtn');
    const card = document.querySelector('.card');
    const mockSelect = document.getElementById('mockMode');

    const state = { loading: false, ctrl: null, timer: null };

    const setStatus = (msg, tone = 'muted') => {
      status.textContent = msg || '';
      status.style.color = tone === 'err' ? getCSS('--err') : tone === 'ok' ? getCSS('--ok') : 'var(--muted)';
    };

    const setDisabled = (disabled) => {
      [email, password, btn, mockSelect].forEach(el => el.disabled = !!disabled);
    };

    const setProgress = (val) => {
      progressBar.style.width = `${val}%`;
      progressBar.setAttribute('aria-valuenow', String(Math.round(val)));
    };

    const validate = () => {
      let ok = true;
      const ev = String(email.value || '').trim();
      const pv = String(password.value || '');
      // reset
      email.setAttribute('aria-invalid', 'false');
      password.setAttribute('aria-invalid', 'false');
      document.getElementById('emailErr').textContent = '';
      document.getElementById('pwdErr').textContent = '';

      if (!ev) { ok = false; markErr(email, '请输入邮箱'); }
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ev)) { ok = false; markErr(email, '邮箱格式不正确'); }

      if (!pv) { ok = false; markErr(password, '请输入密码'); }
      else if (pv.length < 8) { ok = false; markErr(password, '密码长度至少 8 位'); }

      return ok;
    };

    const markErr = (input, msg) => {
      input.setAttribute('aria-invalid', 'true');
      const id = input.id === 'email' ? 'emailErr' : 'pwdErr';
      document.getElementById(id).textContent = msg;
    };

    const animateProgressWhileLoading = () => {
      let val = 0;
      setProgress(0);
      state.timer = setInterval(() => {
        val += Math.random() * 8;
        if (val > 90) val = 90;
        setProgress(val);
      }, 180);
    };

    const stopProgress = () => { clearInterval(state.timer); state.timer = null; };

    const onSubmit = async (e) => {
      e.preventDefault();
      if (state.loading) return;
      setStatus('');
      if (!validate()) {
        setStatus('请检查输入', 'err');
        return;
      }

      // begin loading
      state.loading = true;
      card.classList.remove('shake');
      btn.classList.remove('btn--ok');
      setDisabled(true);
      setProgress(0);
      animateProgressWhileLoading();

      const ctrl = new AbortController();
      state.ctrl = ctrl;

      // ESC cancels
      const onKey = (ev) => {
        if (ev.key === 'Escape' && state.loading) {
          ctrl.abort();
          setStatus('已取消', 'muted');
        }
      };
      window.addEventListener('keydown', onKey);

      try {
        const payload = { email: String(email.value).trim(), password: String(password.value) };
        const mock = mockSelect.value;
        const res = await withTimeout(2000, mockRequestOrFetch(mock, payload, ctrl.signal));
        // success
        stopProgress();
        setProgress(100);
        setStatus('登录成功', 'ok');
        btn.classList.add('btn--ok');
        // check animation duration ~520ms -> wait 800ms
        await wait(800);
        onLoginSuccess();
      } catch (err) {
        // failure
        stopProgress();
        setProgress(0);
        setStatus(err && err.message ? err.message : '登录失败，请稍后重试', 'err');
        card.classList.remove('shake');
        // reflow to restart animation
        void card.offsetWidth;
        card.classList.add('shake');
      } finally {
        state.loading = false;
        setDisabled(false);
        window.removeEventListener('keydown', onKey);
        state.ctrl = null;
      }
    };

    form.addEventListener('submit', onSubmit);
  }

  function onLoginSuccess() {
    // 替换为真实跳转逻辑
    // window.location.href = '/dashboard';
  }

  // handle mock or real request
  function mockRequestOrFetch(mode, payload, signal) {
    if (mode === 'success') return wait(600).then(() => ({ ok: true }));
    if (mode === 'fail') return wait(600).then(() => { const e = new Error('模拟失败：账号或密码错误'); e.code = 401; throw e; });

    return fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: payload.email, password: payload.password }),
      signal
    }).then(async (res) => {
      if (!res.ok) {
        const msg = await safeText(res) || '登录失败';
        throw new Error(msg);
      }
      return res.json().catch(() => ({}));
    });
  }

  // ------------------------ Micro Interactions ------------------------
  function initMicroInteractions({ reduced }) {
    const btn = document.getElementById('submitBtn');
    if (!btn) return;

    // Magnetic hover (skip if reduced motion)
    if (!reduced) {
      const radius = getCSS('--magnet-radius') ? parseInt(getCSS('--magnet-radius')) : 140;
      let raf = 0; let tx = 0, ty = 0; let x = 0, y = 0;

      const onMove = (e) => {
        const r = btn.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < radius) {
          const strength = (1 - dist / radius) * 0.6; // 0..0.6
          tx = dx * 0.25 * strength;
          ty = dy * 0.25 * strength;
        } else {
          tx = 0; ty = 0;
        }
        if (!raf) raf = requestAnimationFrame(apply);
      };

      const apply = () => {
        raf = 0;
        x += (tx - x) * 0.16; y += (ty - y) * 0.16;
        btn.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      };

      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerleave', () => { tx = ty = 0; if (!raf) raf = requestAnimationFrame(apply); }, { passive: true });
    }

    // Press feedback
    const down = () => btn.classList.add('pressed');
    const up = () => btn.classList.remove('pressed');
    btn.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
  }

  // ------------------------ Utils ------------------------
  function withTimeout(ms, promise) {
    let id;
    const t = new Promise((_, rej) => { id = setTimeout(() => rej(new Error('请求超时，请稍后重试')), ms); });
    return Promise.race([promise.finally(() => clearTimeout(id)), t]);
  }
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn.apply(null, a), ms); }; }
  function rnd(min, max) { return min + Math.random() * (max - min); }
  function rndi(min, max) { return Math.floor(rnd(min, max)); }
  function clamp(a, b, v) { return Math.max(a, Math.min(b, v)); }
  function getCSS(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  async function safeText(res) { try { return await res.text(); } catch { return ''; } }
})();

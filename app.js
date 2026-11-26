class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { now: Date.now(), form: { fio: '', dept: '' }, tried: false, sending: false, done: false, egg: false };
    this.hflakes = [];
    for (let i = 0; i < 42; i++) {
      const sz = 2 + ((i * 7) % 5);
      this.hflakes.push({ l: ((i * 61) % 100) + '%', s: sz + 'px', o: (0.3 + ((i * 13) % 50) / 100).toFixed(2), d: (9 + ((i * 17) % 120) / 10).toFixed(1) + 's', dl: '-' + (((i * 29) % 200) / 10).toFixed(1) + 's' });
    }
    // gold glints over the hero (premiere sparkle), placed mostly around the entrance
    this.glints = [];
    for (let i = 0; i < 16; i++) {
      this.glints.push({ l: (42 + ((i * 37) % 56)) + '%', t: (6 + ((i * 23) % 58)) + '%', s: (14 + ((i * 11) % 18)) + 'px', d: '-' + (((i * 47) % 50) / 10).toFixed(1) + 's', u: (3.2 + ((i * 13) % 30) / 10).toFixed(1) + 's' });
    }
    // gold & silver confetti for the "booked" moment
    const conf = ['#E9C979', '#F7E3A1', '#C8963A', '#DCDCDC', '#FFFFFF', '#B23A2E'];
    this.confetti = [];
    for (let i = 0; i < 70; i++) {
      this.confetti.push({ l: ((i * 41) % 100) + '%', w: (6 + (i % 4) * 2) + 'px', h: (10 + (i % 3) * 4) + 'px', bg: conf[i % conf.length],
        d: (((i * 7) % 12) / 10).toFixed(1) + 's', u: (2.6 + ((i * 13) % 16) / 10).toFixed(1) + 's', r: (360 + (i * 47) % 540) + 'deg' });
    }
    // sparks for the neon sign and the gold burst from the cinema doors
    this.sparks = [];
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; this.sparks.push({ x: (Math.cos(a) * (1.2 + (i % 3) * .5)).toFixed(2) + 'em', y: (Math.sin(a) * (0.9 + (i % 4) * .35) + .6).toFixed(2) + 'em', d: ((i % 5) * .04).toFixed(2) + 's' }); }
    const gold = ['#E9C979', '#F7E3A1', '#C8963A', '#FFF4C6', '#DCDCDC'];
    this.burst = [];
    for (let i = 0; i < 30; i++) { const a = -Math.PI / 2 + (i / 29 - .5) * 2.6; const r = 3 + (i * 7) % 6;
      this.burst.push({ x: (Math.cos(a) * r).toFixed(1) + 'vw', y: (Math.sin(a) * r * .8 + 2 + (i % 4)).toFixed(1) + 'vw', r: (200 + (i * 53) % 400) + 'deg', bg: gold[i % gold.length], w: (4 + i % 3 * 2) + 'px', h: (7 + i % 4 * 2) + 'px', d: ((i % 6) * .03).toFixed(2) + 's' }); }
    this.eggFlakes = [];
    for (let i = 0; i < 34; i++) {
      const sz = 16 + ((i * 37) % 28);
      this.eggFlakes.push({ l: ((i * 53) % 100) + '%', s: sz + 'px', o: (0.55 + ((i * 17) % 40) / 100).toFixed(2), d: (5 + ((i * 29) % 50) / 10).toFixed(1) + 's', dl: (((i * 43) % 30) / 10).toFixed(1) + 's' });
    }
  }
  componentDidMount() {
    this.timer = setInterval(() => this.setState({ now: Date.now() }), 1000);
    // the hero scene is laid out like background-size: cover, so the animated layers stay glued to the picture
    this.heroEl = document.querySelector('.scene-box');
    this.measure = () => {
      const el = this.heroEl; if (!el) return;
      const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return;
      const ar = 2400 / 1400, narrow = window.innerWidth <= 1023;
      // cover: the picture fills the hero; crop mostly from the left / sky so the entrance stays in frame
      let sw, sh; if (w / h > ar) { sw = w; sh = w / ar; } else { sh = h; sw = h * ar; }
      const px = narrow ? 0.774 : 0.75;
      let py = narrow ? 0.5 : 0.3;
      if (!narrow && sh > h) py = Math.min(0.85, Math.max(py, (0.82 * sh - h + 48) / (sh - h)));
      const st = { w: Math.round(sw), h: Math.round(sh), l: Math.round((w - sw) * px), t: Math.round((h - sh) * py) };
      // the car's path is measured from the window: it enters fully past the right edge and leaves fully past the left
      const carW = 0.7346 * st.w, cin = w - st.l + 40, cout = -(st.l + carW) - 40;
      st.car = `--cin: ${Math.round(cin)}px; --cout: ${Math.round(cout)}px; --win: ${Math.round(cin / carW * 953)}deg; --wout: ${Math.round(cout / carW * 953)}deg`;
      if (narrow) st.frame = '';
      else {
        const k = Math.max(0.8, Math.min(1.3, w / 1440, h / 900));
        st.frame = `top: ${Math.round(h * 0.06)}px; transform: scale(${k.toFixed(4)})`;
      }
      const o = this.state.stage;
      if (!o || o.w !== st.w || o.h !== st.h || o.l !== st.l || o.t !== st.t || o.frame !== st.frame || o.car !== st.car) this.setState({ stage: st });
    };
    this.measure();
    // Scroll-triggered surprises. If the whole page already fits in the window (the design canvas,
    // or a very tall screen), nothing ever scrolls into view, so they start when the pointer reaches the block.
    this.unseen = [];
    const whenSeen = (el, threshold, fn) => {
      if (!el) return;
      const fits = window.innerHeight >= document.documentElement.scrollHeight - 40;
      if (fits || !window.IntersectionObserver) {
        const go = () => { el.removeEventListener('pointerenter', go); fn(); };
        el.addEventListener('pointerenter', go);
        this.unseen.push(() => el.removeEventListener('pointerenter', go));
        return;
      }
      const io = new IntersectionObserver((ents) => {
        if (!ents.some((e) => e.isIntersecting)) return;
        io.disconnect(); fn();
      }, { threshold });
      io.observe(el);
      this.unseen.push(() => io.disconnect());
    };
    // film-leader countdown "3-2-1" the first time the "about" section is seen
    whenSeen(document.getElementById('about'), 0.35, () => {
      this.setState({ leader: true });
      this.leaderTimer = setTimeout(() => this.setState({ leader: false }), 2100);
    });
    // the RESO snowflake surprise plays by itself the first time the footer is seen (the button still works)
    whenSeen(document.querySelector('footer'), 0.15, () => this.playEgg(false));
    // paparazzi flashes while scrolling (not more often than every ~2.8 s)
    this.lastFlash = 0;
    this.onScroll = () => {
      const t = Date.now();
      if (t - this.lastFlash < 2800 || Math.random() > 0.5) return;
      this.lastFlash = t;
      const left = Math.random() < 0.5, prev = this.state.flash;
      this.setState({ flash: { cls: prev && prev.cls === 'fa' ? 'fb' : 'fa', x: (left ? 4 + Math.random() * 10 : 86 + Math.random() * 10).toFixed(1) + '%', y: (18 + Math.random() * 64).toFixed(1) + '%' } });
    };
    window.addEventListener('scroll', this.onScroll, { passive: true });
    // warm spotlight that follows the cursor on dark sections (desktop only)
    if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const root = document.documentElement; let raf = 0, mx = 0, my = 0;
      this.onMove = (e) => { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(() => { raf = 0; root.style.setProperty('--mx', mx + 'px'); root.style.setProperty('--my', my + 'px'); }); };
      window.addEventListener('mousemove', this.onMove, { passive: true });
    }
    if (window.ResizeObserver && this.heroEl) { this.ro = new ResizeObserver(() => this.measure()); this.ro.observe(this.heroEl); }
    window.addEventListener('resize', this.measure);
  }
  componentWillUnmount() { clearInterval(this.timer); clearTimeout(this.eggTimer); clearTimeout(this.lookTimer); (this.neonTimers || []).forEach(clearTimeout); clearTimeout(this.doorTimer); clearTimeout(this.leaderTimer); (this.unseen || []).forEach((off) => off()); window.removeEventListener('scroll', this.onScroll); if (this.onMove) window.removeEventListener('mousemove', this.onMove); if (this.ro) this.ro.disconnect(); window.removeEventListener('resize', this.measure); }

  // ===== ПОДКЛЮЧЕНИЕ БЭКЕНДА =====
  // Заглушка: имитирует успешную отправку. Здесь подключается Google Sheets / Telegram / CRM / почта:
  //   return fetch('https://ВАШ-ЭНДПОИНТ', { method: 'POST', headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(data) }).then(r => { if (!r.ok) throw new Error(); });
  sendRegistration(data) {
    const cfg = window.RESO_CONFIG || {}, url = String(cfg.endpoint || '').trim();
    const fail = (code, msg) => Object.assign(new Error(msg || code), { code });
    if (!url) return Promise.reject(fail('config'));
    if (navigator.onLine === false) return Promise.reject(fail('offline'));
    const ctl = window.AbortController ? new AbortController() : null;
    const tm = setTimeout(() => { if (ctl) ctl.abort(); }, cfg.timeoutMs || 15000);
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data), signal: ctl ? ctl.signal : undefined })
      .then((r) => { clearTimeout(tm); if (!r.ok) throw fail('server', 'HTTP ' + r.status); },
        (e) => { clearTimeout(tm); throw fail(navigator.onLine === false ? 'offline' : (e && e.name === 'AbortError' ? 'timeout' : 'network'), String(e)); });
  }
  sendError(e) {
    const c = e && e.code;
    if (c === 'config') return 'Регистрация пока недоступна: форма не подключена к обработчику заявок. Пожалуйста, сообщите организаторам.';
    if (c === 'offline') return 'Нет подключения к интернету. Данные сохранены — проверьте сеть и отправьте ещё раз.';
    if (c === 'timeout') return 'Сервер не ответил вовремя. Данные сохранены — попробуйте отправить ещё раз.';
    return 'Не удалось отправить заявку. Данные сохранены — попробуйте ещё раз через минуту.';
  }

  validate(f) {
    const e = {};
    const name = f.fio.trim().split(/\s+/).filter(Boolean);
    if (!name.length) e.fio = 'Укажите фамилию и имя';
    else if (name.length < 2) e.fio = 'Укажите и фамилию, и имя';
    else if (!/^[A-Za-zА-Яа-яЁё' -]+$/.test(f.fio.trim())) e.fio = 'Только буквы, без цифр и символов';
    if (!f.dept.trim()) e.dept = 'Укажите департамент';
    return e;
  }
  // soft "ding" made with Web Audio (no sound file), only after a click
  ding() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      this.ac = this.ac || new AC(); const ac = this.ac, t = ac.currentTime;
      [[1318.5, .09], [1975.5, .05], [2637, .025]].forEach(([f, v]) => {
        const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + 1.1);
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 1.2);
      });
    } catch (e) { /* sound is optional */ }
  }
  // snowfall; the greeting is shown only when the snowflake button is clicked
  playEgg(withMsg) {
    clearTimeout(this.eggTimer);
    this.setState({ egg: false, eggMsg: !!withMsg }, () => { this.setState({ egg: true }); this.eggTimer = setTimeout(() => this.setState({ egg: false }), 8000); });
  }
  // easter eggs on the look cards: one surprise at a time
  playLook(name, ms) {
    if (this.state.look) return;
    this.setState({ look: name });
    this.lookTimer = setTimeout(() => this.setState({ look: '' }), ms);
  }
  setField(k, v) { this.setState({ form: Object.assign({}, this.state.form, { [k]: v }), sendErr: '' }); }
  plural(n, f) { const a = n % 100, b = n % 10; if (a > 10 && a < 20) return f[2]; if (b === 1) return f[0]; if (b > 1 && b < 5) return f[1]; return f[2]; }

  renderVals() {
    const s = this.state, demo = this.props.formDemo || 'live';
    const left = Math.max(0, Date.UTC(2026, 11, 23, 14, 0, 0) - s.now); // 23.12.2026 17:00 МСК
    const D = Math.floor(left / 86400000), H = Math.floor(left / 3600000) % 24, M = Math.floor(left / 60000) % 60, S = Math.floor(left / 1000) % 60;
    const p2 = (n) => String(n).padStart(2, '0');
    const cd = { running: left > 0, over: left <= 0, d: String(D), h: p2(H), m: p2(M), s: p2(S),
      dl: this.plural(D, ['день', 'дня', 'дней']), hl: this.plural(H, ['час', 'часа', 'часов']) };

    let form = s.form, tried = s.tried, done = s.done;
    if (demo === 'error') { form = { fio: 'Смирнова', dept: '' }; tried = true; done = false; }
    if (demo === 'success') { form = { fio: 'Смирнова Анна', dept: 'Департамент продаж' }; done = true; }
    const errs = tried ? this.validate(form) : {}, bad = '#9B2C22', base = '#8a7a66';
    const err = {
      fio: errs.fio || '', dept: errs.dept || '',
      fioInvalid: errs.fio ? 'true' : 'false', deptInvalid: errs.dept ? 'true' : 'false',
      fioBorder: errs.fio ? bad : base, deptBorder: errs.dept ? bad : base,
      fioDesc: errs.fio ? 've-fio' : null, deptDesc: errs.dept ? 've-dept' : null
    };
    return {
      cd, err, form, done, showForm: !done, sending: s.sending,
      egg: s.egg, eggFlakes: this.eggFlakes,
      ready: !!s.stage, hflakes: this.hflakes, glints: this.glints, confetti: this.confetti,
      leader: !!s.leader, flash: s.flash || { cls: '', x: '0%', y: '0%' },
      pc: { ind: s.look === 'ind' ? 'e-ind' : '', marty: s.look === 'marty' ? 'e-marty' : '', dor: s.look === 'dor' ? 'e-dor' : '', mary: s.look === 'mary' ? 'e-mary' : '' },
      boulder: s.look === 'ind',
      look_ind: () => this.playLook('ind', 2500),
      look_marty: () => this.playLook('marty', 2900),
      look_dor: () => this.playLook('dor', 3100),
      look_mary: () => { this.playLook('mary', 3100); this.ding(); },
      sparks: this.sparks, burst: this.burst, doorBurst: !!s.doorBurst, doorCls: s.doorCls || '',
      neon: { cls: s.neon ? 'n-' + s.neon : '', ny: s.neon === 'ny', std: s.neon !== 'ny', sparks: s.neon === 'spark' },
      // easter egg: the neon sparks, goes dark and relights as "С Новым годом!"
      neonClick: () => {
        if (this.state.neon) return;
        (this.neonTimers || []).forEach(clearTimeout);
        this.setState({ neon: 'spark' });
        this.neonTimers = [
          setTimeout(() => this.setState({ neon: 'off' }), 450),
          setTimeout(() => this.setState({ neon: 'ny' }), 1150),
          setTimeout(() => this.setState({ neon: '' }), 5600)
        ];
      },
      // easter egg: the cinema doors open out of turn with a gold burst and a soft ding
      doorClick: () => {
        clearTimeout(this.doorTimer);
        const next = this.state.doorCls === 'pop-a' ? 'pop-b' : 'pop-a';
        this.setState({ doorCls: next, doorBurst: false }, () => this.setState({ doorBurst: true }));
        this.ding();
        this.doorTimer = setTimeout(() => this.setState({ doorCls: '', doorBurst: false }), 3300);
      },
      frameStyle: s.stage ? s.stage.frame : '',
      carStyle: s.stage ? s.stage.car : '',
      stageStyle: s.stage ? `left: ${s.stage.l}px; top: ${s.stage.t}px; width: ${s.stage.w}px; height: ${s.stage.h}px; --sw: ${s.stage.w}px` : 'left: 0px; top: 0px; width: 100%; height: 100%',
      eggOn: () => this.playEgg(true),
      eggMsg: !!s.eggMsg,
      idle: !s.sending,
      sendErr: s.sendErr || '',
      guestName: form.fio.trim().replace(/\s+/g, ' '),
      guestDept: form.dept.trim(),
      onFio: (e) => this.setField('fio', e.target.value),
      onDept: (e) => this.setField('dept', e.target.value),
      submit: (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (this.state.sending || demo !== 'live') return;
        const f = this.state.form;
        const bad = this.validate(f);
        if (Object.keys(bad).length) { this.setState({ tried: true, sendErr: '' }); const el = document.getElementById(bad.fio ? 'v-fio' : 'v-dept'); if (el) el.focus(); return; }
        this.setState({ tried: true, sending: true, sendErr: '' });
        this.sendRegistration({ fullName: f.fio.trim().replace(/\s+/g, ' '), department: f.dept.trim(), createdAt: new Date().toISOString() })
          .then(() => this.setState({ sending: false, done: true }), (er) => this.setState({ sending: false, sendErr: this.sendError(er) }));
      }
    };
  }
}

mountDC(Component, { formDemo: 'live' }, document.getElementById('app'), document.getElementById('tpl'));

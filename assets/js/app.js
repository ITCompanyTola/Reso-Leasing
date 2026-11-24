class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { now: Date.now(), form: { fio: '', film: '', hero: '', agree: false }, tried: false, sending: false, done: false, egg: false };
    this.hflakes = [];
    for (let i = 0; i < 42; i++) {
      const sz = 2 + ((i * 7) % 5);
      this.hflakes.push({ l: ((i * 61) % 100) + '%', s: sz + 'px', o: (0.3 + ((i * 13) % 50) / 100).toFixed(2), d: (9 + ((i * 17) % 120) / 10).toFixed(1) + 's', dl: '-' + (((i * 29) % 200) / 10).toFixed(1) + 's' });
    }
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
      const px = narrow ? 0.774 : 0.75, py = narrow ? 0.5 : 0.3;
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
    if (window.ResizeObserver && this.heroEl) { this.ro = new ResizeObserver(() => this.measure()); this.ro.observe(this.heroEl); }
    window.addEventListener('resize', this.measure);
  }
  componentWillUnmount() { clearInterval(this.timer); clearTimeout(this.eggTimer); if (this.ro) this.ro.disconnect(); window.removeEventListener('resize', this.measure); }

  // ===== ПОДКЛЮЧЕНИЕ БЭКЕНДА =====
  // Заглушка: имитирует успешную отправку. Здесь подключается Google Sheets / Telegram / CRM / почта:
  //   return fetch('https://ВАШ-ЭНДПОИНТ', { method: 'POST', headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(data) }).then(r => { if (!r.ok) throw new Error(); });
  sendRegistration(data) { return new Promise((resolve) => setTimeout(resolve, 900)); }

  digits(v) { let d = String(v || '').replace(/\D/g, ''); if (d.length && (d[0] === '7' || d[0] === '8')) d = d.slice(1); return d.slice(0, 10); }
  formatPhone(v) {
    const d = this.digits(v); if (!d.length) return '';
    let o = '+7 (' + d.slice(0, 3); if (d.length >= 3) o += ')';
    if (d.length > 3) o += ' ' + d.slice(3, 6); if (d.length > 6) o += '-' + d.slice(6, 8); if (d.length > 8) o += '-' + d.slice(8, 10);
    return o;
  }
  validate(f) {
    const e = {};
    const fio = f.fio.trim().split(/\s+/).filter(Boolean);
    if (!fio.length) e.fio = 'Укажите фамилию, имя и отчество';
    else if (fio.length < 2) e.fio = 'Укажите хотя бы фамилию и имя';
    else if (!/^[A-Za-zА-Яа-яЁё' -]+$/.test(f.fio.trim())) e.fio = 'Только буквы, без цифр и символов';
    if (!f.film.trim()) e.film = 'Укажите название фильма';
    if (!f.hero.trim()) e.hero = 'Укажите имя героя';
    return e;
  }
  setField(k, v) { this.setState({ form: Object.assign({}, this.state.form, { [k]: v }) }); }
  plural(n, f) { const a = n % 100, b = n % 10; if (a > 10 && a < 20) return f[2]; if (b === 1) return f[0]; if (b > 1 && b < 5) return f[1]; return f[2]; }

  renderVals() {
    const s = this.state, demo = this.props.formDemo || 'live';
    const left = Math.max(0, Date.UTC(2026, 11, 23, 14, 0, 0) - s.now); // 23.12.2026 17:00 МСК
    const D = Math.floor(left / 86400000), H = Math.floor(left / 3600000) % 24, M = Math.floor(left / 60000) % 60, S = Math.floor(left / 1000) % 60;
    const p2 = (n) => String(n).padStart(2, '0');
    const cd = { running: left > 0, over: left <= 0, d: String(D), h: p2(H), m: p2(M), s: p2(S),
      dl: this.plural(D, ['день', 'дня', 'дней']), hl: this.plural(H, ['час', 'часа', 'часов']) };

    let form = s.form, tried = s.tried, done = s.done;
    if (demo === 'error') { form = { fio: 'Смирнова', film: '', hero: 'Малефисента', agree: false }; tried = true; done = false; }
    if (demo === 'success') { form = { fio: 'Смирнова Анна Сергеевна', film: 'Малефисента', hero: 'Малефисента', agree: true }; done = true; }
    const errs = tried ? this.validate(form) : {}, bad = '#9B2C22', base = '#8a7a66';
    const err = {
      fio: errs.fio || '', film: errs.film || '', hero: errs.hero || '', agree: errs.agree || '',
      fioInvalid: errs.fio ? 'true' : 'false', filmInvalid: errs.film ? 'true' : 'false', heroInvalid: errs.hero ? 'true' : 'false', agreeInvalid: errs.agree ? 'true' : 'false',
      fioBorder: errs.fio ? bad : base, filmBorder: errs.film ? bad : base, heroBorder: errs.hero ? bad : base
    };
    return {
      cd, err, form, done, showForm: !done, sending: s.sending,
      egg: s.egg, eggFlakes: this.eggFlakes,
      ready: !!s.stage, hflakes: this.hflakes,
      frameStyle: s.stage ? s.stage.frame : '',
      carStyle: s.stage ? s.stage.car : '',
      stageStyle: s.stage ? `left: ${s.stage.l}px; top: ${s.stage.t}px; width: ${s.stage.w}px; height: ${s.stage.h}px` : 'left: 0px; top: 0px; width: 100%; height: 100%',
      eggOn: () => { clearTimeout(this.eggTimer); this.setState({ egg: false }, () => { this.setState({ egg: true }); this.eggTimer = setTimeout(() => this.setState({ egg: false }), 8000); }); },
      submitLabel: s.sending ? 'Бронируем…' : 'Забронировать место',
      guestName: form.fio.trim().replace(/\s+/g, ' '),
      onFio: (e) => this.setField('fio', e.target.value),
      onFilm: (e) => this.setField('film', e.target.value),
      onHero: (e) => this.setField('hero', e.target.value),
      onAgree: (e) => this.setField('agree', !!e.target.checked),
      submit: (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (this.state.sending || demo !== 'live') return;
        const f = this.state.form;
        if (Object.keys(this.validate(f)).length) { this.setState({ tried: true }); return; }
        this.setState({ tried: true, sending: true });
        this.sendRegistration({ fullName: f.fio.trim().replace(/\s+/g, ' '), film: f.film.trim(), hero: f.hero.trim(), consent: true, createdAt: new Date().toISOString() })
          .then(() => this.setState({ sending: false, done: true })).catch(() => this.setState({ sending: false }));
      }
    };
  }
}

mountDC(Component, { formDemo: 'live' }, document.getElementById('app'), document.getElementById('tpl'));

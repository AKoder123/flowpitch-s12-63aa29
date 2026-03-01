(function(){
  const qs = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const state = {
    data: null,
    current: 0,
    total: 0,
    wheelLock: false,
    compactThreshold: 700
  };

  async function loadContent() {
    try {
      const res = await fetch('./content.json?ts=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load content.json');
      const data = await res.json();
      state.data = data;
      buildUI(data);
    } catch (err) {
      console.error(err);
      const slidesEl = qs('#slides');
      if (slidesEl) slidesEl.innerHTML = '<div style="padding:24px">Error loading content. Ensure content.json is present.</div>';
    }
  }

  function updateTopOffset() {
    const nav = qs('#topNav');
    const h = nav ? nav.getBoundingClientRect().height : 0;
    document.documentElement.style.setProperty('--topOffset', Math.round(h) + 'px');
  }

  function applyCompactMode() {
    const h = window.innerHeight;
    const body = document.body;
    if (h < state.compactThreshold) body.classList.add('compact'); else body.classList.remove('compact');
  }

  function buildUI(data){
    const deckTitle = qs('#deckTitle');
    if (deckTitle) deckTitle.textContent = data?.meta?.title || 'Deck';

    const slidesEl = qs('#slides');
    if (!slidesEl) return;

    slidesEl.innerHTML = '';

    // Build slides
    data.slides.forEach((s, i) => {
      const slide = document.createElement('section');
      slide.className = 'slide';
      slide.dataset.type = s.type;
      slide.dataset.index = String(i);
      slide.style.setProperty('--textScale', '1');

      const card = document.createElement('div');
      card.className = 'slideCard';

      // Build content depending on type
      if (s.type === 'title') {
        const h1 = document.createElement('h1');
        h1.className = 'h1 grad';
        h1.textContent = s.headline || '';
        h1.setAttribute('data-animate','');
        h1.style.setProperty('--stagger','0');
        card.appendChild(h1);

        if (s.subheadline) {
          const p = document.createElement('p');
          p.className = 'lead';
          p.textContent = s.subheadline;
          p.setAttribute('data-animate','');
          p.style.setProperty('--stagger','1');
          card.appendChild(p);
        }
      } else if (s.type === 'section') {
        const h = document.createElement('h2');
        h.className = 'h1 grad';
        h.textContent = s.headline || '';
        h.setAttribute('data-animate','');
        h.style.setProperty('--stagger','0');
        card.appendChild(h);
        if (s.subheadline) {
          const p = document.createElement('p');
          p.className = 'lead';
          p.textContent = s.subheadline;
          p.setAttribute('data-animate','');
          p.style.setProperty('--stagger','1');
          card.appendChild(p);
        }
      } else if (s.type === 'closing') {
        const h2 = document.createElement('h2');
        h2.className = 'h1 grad';
        h2.textContent = s.headline || '';
        h2.setAttribute('data-animate','');
        h2.style.setProperty('--stagger','0');
        card.appendChild(h2);
        if (Array.isArray(s.bullets)) {
          const ul = document.createElement('ul');
          ul.className = 'bullets';
          s.bullets.forEach((b, bi) => {
            const li = document.createElement('li');
            li.textContent = b;
            li.setAttribute('data-animate','');
            li.style.setProperty('--stagger', String(1 + bi));
            ul.appendChild(li);
          });
          card.appendChild(ul);
        }
      } else {
        // content, beforeAfter, generic
        const wrap = document.createElement('div');
        wrap.className = 'contentWrap';

        const textCol = document.createElement('div');
        textCol.className = 'textCol';

        if (s.headline) {
          const h2 = document.createElement('h2');
          h2.className = 'h2';
          h2.textContent = s.headline;
          h2.setAttribute('data-animate','');
          h2.style.setProperty('--stagger','0');
          textCol.appendChild(h2);
        }
        if (s.subheadline) {
          const p = document.createElement('p');
          p.className = 'lead';
          p.textContent = s.subheadline;
          p.setAttribute('data-animate','');
          p.style.setProperty('--stagger','1');
          textCol.appendChild(p);
        }
        if (Array.isArray(s.bullets)) {
          const ul = document.createElement('ul');
          ul.className = 'bullets';
          s.bullets.forEach((b, bi) => {
            const li = document.createElement('li');
            li.textContent = b;
            li.setAttribute('data-animate','');
            li.style.setProperty('--stagger', String(2 + bi));
            ul.appendChild(li);
          });
          textCol.appendChild(ul);
        }

        // Accent column (decorative, no content editing needed)
        const accentCol = document.createElement('aside');
        accentCol.className = 'accentCol';
        const panel = document.createElement('div');
        panel.className = 'accentPanel';
        const badge = document.createElement('div');
        badge.className = 'accentBadge';
        const bd = document.createElement('span');
        bd.className = 'badgeDot';
        bd.setAttribute('aria-hidden','true');
        const bt = document.createElement('span');
        bt.textContent = (state.data?.meta?.theme || 'theme') + ' • #' + ((state.data?.meta?.deckId || '').toString().slice(-4) || '0000');
        badge.appendChild(bd); badge.appendChild(bt);
        badge.setAttribute('data-animate','');
        badge.style.setProperty('--stagger','0');
        panel.appendChild(badge);

        // Decorative ring
        const ring = document.createElement('div');
        ring.style.cssText = 'margin-top:16px; width:100%; height:180px; border-radius:14px; background: radial-gradient(220px 140px at 65% 35%, rgba(255,210,60,0.22), transparent 60%), radial-gradient(280px 180px at 20% 80%, rgba(255,140,0,0.18), transparent 60%); border:1px solid var(--thinBorder); box-shadow: inset 0 0 0 1px rgba(255,200,60,0.06)';
        ring.setAttribute('data-animate','');
        ring.style.setProperty('--stagger','1');
        panel.appendChild(ring);

        accentCol.appendChild(panel);

        wrap.appendChild(textCol);
        wrap.appendChild(accentCol);
        card.appendChild(wrap);
      }

      slide.appendChild(card);
      slidesEl.appendChild(slide);
    });

    state.total = data.slides.length;

    // Initialize dots
    buildDots();

    // Activate first slide
    goTo(0, { initial: true });

    // Listeners
    wireControls();

    // After layout
    updateTopOffset();
    applyCompactMode();
    fitAll();

    window.addEventListener('resize', debounce(() => { updateTopOffset(); applyCompactMode(); fitAll(); }, 120));
    window.addEventListener('orientationchange', () => { setTimeout(()=>{ updateTopOffset(); applyCompactMode(); fitAll(); }, 100); });

    setupPdfExport();
  }

  function buildDots(){
    const side = qs('#sideDots');
    if (!side) return;
    side.innerHTML = '';
    for (let i=0; i<state.total; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dotBtn';
      b.setAttribute('aria-label', 'Go to slide ' + (i+1));
      const inner = document.createElement('span');
      inner.className = 'dot';
      b.appendChild(inner);
      b.addEventListener('click', () => goTo(i));
      side.appendChild(b);
    }
    updateProgressUI();
  }

  function updateProgressUI(){
    const progress = qs('#topProgressBar');
    if (progress && state.total > 1) {
      const pct = (state.current / (state.total - 1)) * 100;
      progress.style.width = pct + '%';
    }
    const dots = qsa('#sideDots .dotBtn');
    dots.forEach((d, i) => {
      if (i === state.current) { d.setAttribute('aria-current','true'); }
      else { d.removeAttribute('aria-current'); }
    });
  }

  function wireControls(){
    const prev = qs('#prevBtn');
    const next = qs('#nextBtn');
    prev && prev.addEventListener('click', () => prevSlide());
    next && next.addEventListener('click', () => nextSlide());

    document.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (e.shiftKey) prevSlide(); else nextSlide();
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault(); nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault(); prevSlide();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault(); nextSlide();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault(); prevSlide();
      }
    });

    // Wheel / trackpad navigation (debounced) with inner scroll allowance
    window.addEventListener('wheel', (e) => {
      const active = getActiveSlide();
      if (!active) return;
      const textCol = active.querySelector('.textCol');
      const delta = e.deltaY || e.wheelDeltaY || 0;
      if (allowInnerScroll(textCol, delta)) return; // let default scroll

      e.preventDefault();
      if (state.wheelLock) return;
      state.wheelLock = true;
      if (delta > 0) nextSlide(); else prevSlide();
      setTimeout(()=>{ state.wheelLock = false; }, 500);
    }, { passive: false });
  }

  function allowInnerScroll(el, delta){
    if (!el) return false;
    if (el.scrollHeight <= el.clientHeight + 2) return false; // no overflow
    const atTop = el.scrollTop <= 0;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
    if (delta > 0 && !atBottom) return true; // scrolling down and not at bottom
    if (delta < 0 && !atTop) return true; // scrolling up and not at top
    return false;
  }

  function getActiveSlide(){
    return qs('.slide.is-active');
  }

  function nextSlide(){ goTo(Math.min(state.current + 1, state.total - 1)); }
  function prevSlide(){ goTo(Math.max(state.current - 1, 0)); }

  function goTo(index, opts={}){
    index = Math.max(0, Math.min(index, state.total - 1));
    if (index === state.current && !opts.force) {
      // still ensure fit
      fitSlide(qs('.slide.is-active'));
      return;
    }

    const slides = qsa('.slide');
    slides.forEach((s, i) => {
      if (i === index) s.classList.add('is-active'); else s.classList.remove('is-active');
    });

    state.current = index;
    updateProgressUI();
    fitSlide(slides[index]);
  }

  function fitAll(){
    qsa('.slide').forEach(s => fitSlide(s));
  }

  function fitSlide(slide){
    if (!slide) return;
    // We measure the card content area
    const card = slide.querySelector('.slideCard');
    if (!card) return;

    // Reset scale, then adjust
    slide.style.setProperty('--textScale', '1');

    const maxScale = 1.08;
    const minScale = 0.85; // keep legibility floor

    // helper to check overflow
    const overflows = () => card.scrollHeight > card.clientHeight + 2;
    const plenty = () => card.clientHeight - card.scrollHeight > Math.max(24, card.clientHeight * 0.06);

    // If overflowing, scale down gradually
    let scale = 1;
    let guard = 0;
    while (overflows() && scale > minScale && guard < 40) {
      scale -= 0.02; guard++;
      slide.style.setProperty('--textScale', scale.toFixed(3));
    }

    // If lots of unused space, gently scale up
    guard = 0;
    while (!overflows() && plenty() && scale < maxScale && guard < 20) {
      scale += 0.01; guard++;
      slide.style.setProperty('--textScale', scale.toFixed(3));
    }
  }

  function debounce(fn, t=120){ let to; return (...a)=>{ clearTimeout(to); to=setTimeout(()=>fn(...a), t); } }

  // PDF Export
  function setupPdfExport(){
    const btn = qs('#exportPdfBtn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      try {
        btn.disabled = true; const old = btn.textContent; btn.textContent = 'Exporting…';
        document.body.classList.add('exportingPdf');

        // Load libs on-demand
        await ensureLib('html2canvas', 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', ()=> window.html2canvas);
        await ensureLib('jspdf', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', ()=> window.jspdf && window.jspdf.jsPDF);

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1920, 1080] });

        const slides = qsa('.slide');
        const stage = qs('#pdfStage');

        for (let i = 0; i < slides.length; i++) {
          // Prepare stage
          stage.innerHTML = '';

          // Clone backgrounds into stage
          qsa('.bgLayer').forEach(layer => {
            const clone = layer.cloneNode(true);
            stage.appendChild(clone);
          });

          // Clone slide
          const cloneSlide = slides[i].cloneNode(true);
          cloneSlide.classList.add('is-active');
          stage.appendChild(cloneSlide);

          await new Promise(r => requestAnimationFrame(r));

          const scale = Math.max(2, window.devicePixelRatio || 1);
          const canvas = await window.html2canvas(stage, {
            backgroundColor: '#050611',
            scale,
            useCORS: true,
            allowTaint: true,
            imageTimeout: 15000
          });
          const imgData = canvas.toDataURL('image/png');

          if (i === 0) pdf.addImage(imgData, 'PNG', 0, 0, 1920, 1080);
          else pdf.addPage([1920,1080], 'landscape'), pdf.addImage(imgData, 'PNG', 0, 0, 1920, 1080);
        }

        pdf.save('FlowPitch.pdf');
        document.body.classList.remove('exportingPdf');
        btn.textContent = old; btn.disabled = false;
      } catch (err) {
        console.error(err);
        alert('PDF export failed. Please allow cdnjs.cloudflare.com or self-host html2canvas and jsPDF.');
        document.body.classList.remove('exportingPdf');
        btn.disabled = false; btn.textContent = 'Export PDF';
      }
    });
  }

  async function ensureLib(name, src, check){
    if (check()) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script'); s.src = src; s.async = true; s.onload = () => resolve(); s.onerror = () => reject(new Error('Failed to load ' + name));
      document.head.appendChild(s);
    });
    if (!check()) throw new Error('Library not available: ' + name);
  }

  // Kickoff
  document.addEventListener('DOMContentLoaded', () => {
    updateTopOffset();
    applyCompactMode();
    loadContent();
  });
})();

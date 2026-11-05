/* Keystroke product animations v1.1 (9 Oct 2026): 29 products
   Usage: <div class="ks-anim" data-ks="job-costing"></div>  then load this file once.
   Colours follow the Instrument tokens. Override any of --ks-base-000, --ks-base-100,
   --ks-hair, --ks-rule, --ks-ink, --ks-mut, --ks-read, --ks-live, --ks-sig on a parent.
   Motion is stepwise and linear (180 ms ticks). Reduced-motion users see the finished state.
   Animations only run while on screen. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg", TICK = 180, uid = 0;
  var MONO = 'var(--ks-mono,"Söhne Mono","IBM Plex Mono",ui-monospace,monospace)';
  var BODY = 'var(--ks-body,"Söhne","Archivo",Helvetica,Arial,sans-serif)';
  var CSS = [
    ".ks-anim{display:block}",
    ".ks-anim svg{display:block;width:100%;height:auto;overflow:visible}",
    ".ks-anim svg *{transition:transform 180ms linear,opacity 180ms linear}",
    ".ks-anim .sline{transition:stroke-dashoffset 1800ms linear}",
    ".ks-anim.ks-reset svg *{transition:none!important}",
    ".ks-anim .t-plate{font:500 7.5px/1 " + MONO + ";letter-spacing:.14em;fill:var(--ks-mut,#8d97a2)}",
    ".ks-anim .t-fig{font:500 13px/1 " + MONO + ";font-variant-numeric:tabular-nums;fill:var(--ks-ink,#e6eaee)}",
    ".ks-anim .t-fig-s{font:400 8.5px/1 " + MONO + ";font-variant-numeric:tabular-nums;fill:var(--ks-ink,#e6eaee)}",
    ".ks-anim .t-drum{font-family:" + MONO + ";font-weight:500;font-variant-numeric:tabular-nums;fill:var(--ks-read,#d6dee6)}",
    ".ks-anim .t-key{font:600 6.5px/1 " + BODY + ";letter-spacing:.12em;fill:#0b0d10}",
    ".ks-anim .sig .t-drum{fill:var(--ks-sig,#ff5247)}",
    ".ks-anim .f-b0{fill:var(--ks-base-000,#0b0d10)}",
    ".ks-anim .f-b1{fill:var(--ks-base-100,#14181c)}",
    ".ks-anim .f-hair{fill:var(--ks-hair,#1e252b)}",
    ".ks-anim .f-rule{fill:var(--ks-rule,#5c666f)}",
    ".ks-anim .f-mut{fill:var(--ks-mut,#8d97a2)}",
    ".ks-anim .f-ink{fill:var(--ks-ink,#e6eaee)}",
    ".ks-anim .f-read{fill:var(--ks-read,#d6dee6)}",
    ".ks-anim .f-live{fill:var(--ks-live,#4ea8ff)}",
    ".ks-anim .f-none{fill:none}",
    ".ks-anim .s-rule{stroke:var(--ks-rule,#5c666f);stroke-width:1}",
    ".ks-anim .s-hair{stroke:var(--ks-hair,#1e252b);stroke-width:1}",
    ".ks-anim .s-ink{stroke:var(--ks-ink,#e6eaee);stroke-width:1.5}",
    ".ks-anim .s-mut{stroke:var(--ks-mut,#8d97a2);stroke-width:2}",
    ".ks-anim .s-sig{stroke:var(--ks-sig,#ff5247);stroke-width:2}",
    ".ks-anim .s-dash{stroke:var(--ks-rule,#5c666f);stroke-width:1;stroke-dasharray:2 3}",
    ".ks-anim .o-l{transform-box:fill-box;transform-origin:0 50%}",
    ".ks-anim .o-b{transform-box:fill-box;transform-origin:50% 100%}",
    ".ks-anim .o-t{transform-box:fill-box;transform-origin:50% 0}",
    ".ks-anim .o-c{transform-box:fill-box;transform-origin:50% 50%}"
  ].join("\n");

  function inject() {
    if (document.getElementById("ks-anim-css")) return;
    var s = document.createElement("style");
    s.id = "ks-anim-css"; s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }
  function E(tag, a, p) {
    var e = document.createElementNS(NS, tag);
    for (var k in a) if (a[k] !== undefined && a[k] !== null) e.setAttribute(k, a[k]);
    if (p) p.appendChild(e);
    return e;
  }
  /* drawing */
  function G(p, cls) { return E("g", cls ? { "class": cls } : {}, p); }
  function R(p, x, y, w, h, cls, rx) { return E("rect", { x: x, y: y, width: w, height: h, "class": cls || "f-b1", rx: rx || 0 }, p); }
  function T(p, x, y, s, cls, anchor) {
    var t = E("text", { x: x, y: y, "class": cls || "t-plate", "text-anchor": anchor || "start" }, p);
    t.textContent = s; return t;
  }
  function L(p, x1, y1, x2, y2, cls) { return E("line", { x1: x1, y1: y1, x2: x2, y2: y2, "class": cls || "s-rule" }, p); }
  /* state setters */
  function op(e, v) { e.style.opacity = v; }
  function tr(e, x, y, extra) { e.style.transform = "translate(" + x + "px," + y + "px)" + (extra || ""); }
  function sx(e, v) { e.style.transform = "scaleX(" + v + ")"; }
  function sy(e, v) { e.style.transform = "scaleY(" + v + ")"; }
  function dur(e, ms) { e.style.transitionDuration = ms + "ms"; }
  function txt(e, s) { if (e.textContent !== s) e.textContent = s; }
  function pr(t, a, b) { return Math.max(0, Math.min(1, (t - a) / (b - a))); }
  function on(t, k) { return t >= k ? 1 : 0; }
  function appear(e, t, k, dx, dy) { op(e, on(t, k)); tr(e, t >= k ? 0 : (dx || 0), t >= k ? 0 : (dy || 0)); }
  /* digit drum: rolls like a mechanical counter; sig:true flashes signal red when the value goes down */
  function D(p, x, y, n, size, sig) {
    var lh = size * 1.15, cw = size * 0.62, g = G(p), cols = [], prev = null, flashT = -99;
    for (var i = 0; i < n; i++) {
      var id = "ksc" + (++uid);
      var cp = E("clipPath", { id: id }, g);
      R(cp, x + i * cw - 1, y - size * 0.86, cw + 2, size * 1.06);
      var outer = E("g", { "clip-path": "url(#" + id + ")" }, g);
      var inner = E("g", { "class": "drum" }, outer);
      for (var d = 0; d < 10; d++) {
        var te = E("text", { x: x + i * cw, y: y + d * lh, "class": "t-drum" }, inner);
        te.style.fontSize = size + "px"; te.textContent = d;
      }
      cols.push(inner);
    }
    return {
      g: g,
      set: function (v, t) {
        var s = String(Math.max(0, Math.round(v)));
        while (s.length < n) s = "0" + s;
        s = s.slice(-n);
        for (var i = 0; i < n; i++) cols[i].style.transform = "translateY(" + (-(+s[i]) * lh) + "px)";
        if (t === 0) { flashT = -99; prev = null; }
        if (sig && prev !== null && v < prev) flashT = t;
        prev = v;
        if (sig && t >= flashT && t - flashT < 2) g.classList.add("sig"); else g.classList.remove("sig");
      }
    };
  }
  function keycap(p, x, y, w, h, label) {
    var g = G(p);
    R(g, x, y + 2, w, h, "f-rule", 3);
    var top = G(g);
    R(top, x, y, w, h, "f-read", 3);
    T(top, x + w / 2, y + h / 2 + 2.3, label, "t-key", "middle");
    return top;
  }
  function press(top, t, k) { tr(top, 0, t === k ? 1.5 : 0); }
  function live(p, x, y) { return R(p, x, y, 9, 9, "f-live"); }
  function pulse(e, t) { op(e, t % 4 < 2 ? 1 : 0.3); }

  var DEFS = {};
  function def(name, o) { DEFS[name] = o; }

  /* ---------------- 01 COUNT ---------------- */
  def("reporting-pack", { label: "Monthly reporting pack: the pack arrives on day one instead of day five", ticks: 36, build: function (s) {
    var o = {};
    T(s, 16, 22, "PACK ARRIVES");
    o.d = D(s, 16, 84, 2, 44, true);
    T(s, 16, 104, "BUSINESS DAY");
    o.pages = [];
    for (var i = 0; i < 4; i++) {
      var g = G(s), x = 136 + i * 7, y = 14 + i * 7;
      R(g, x, y, 70, 92, "f-b1 s-rule");
      R(g, x + 8, y + 9, 32, 5, "f-ink");
      for (var j = 0; j < 3; j++) R(g, x + 8, y + 22 + j * 8, 52 - j * 9, 3, "f-mut");
      var hs = [14, 22, 18, 30, 26];
      for (var k = 0; k < 5; k++) R(g, x + 8 + k * 11, y + 82 - hs[k], 8, hs[k], k === 4 ? "f-ink" : "f-rule");
      o.pages.push(g);
    }
    o.sent = T(s, 136, 146, "SENT · DAY 1");
    return o;
  }, step: function (o, t) {
    o.d.set(t < 8 ? 5 : Math.max(1, 5 - Math.floor((t - 5) / 3)), t);
    o.pages.forEach(function (g, i) { appear(g, t, 6 + i * 4, 0, 10); });
    op(o.sent, on(t, 20));
  } });

  def("job-costing", { label: "Job costing report: quoted against actual cost for every open job", ticks: 36, build: function (s) {
    var o = { rows: [] }, data = [["J-0412", .70, .58], ["J-0415", .60, .74], ["J-0417", .80, .62], ["J-0420", .66, .48]];
    T(s, 16, 20, "OPEN JOBS · QUOTED VS ACTUAL");
    data.forEach(function (d, i) {
      var y = 34 + i * 24;
      T(s, 16, y + 8, d[0], "t-fig-s");
      R(s, 64, y, 136, 10, "f-b1");
      var bar = R(s, 64, y, 136, 10, "f-mut o-l");
      L(s, 64 + 136 * d[1], y - 3, 64 + 136 * d[1], y + 13, "s-ink");
      var over = T(s, 232, y + 8, "+" + Math.round((d[2] / d[1] - 1) * 100) + "%", "t-fig-s", "end");
      o.rows.push({ bar: bar, over: over, q: d[1], a: d[2] });
    });
    T(s, 16, 140, "LINE = QUOTED · BAR = ACTUAL");
    return o;
  }, step: function (o, t) {
    o.rows.forEach(function (r) {
      var v = Math.min(r.a, Math.max(0, t - 3) * 0.04);
      sx(r.bar, v);
      op(r.over, v > r.q ? 1 : 0);
    });
  } });

  def("daily-board", { label: "Daily numbers board: this week's figures, refreshed overnight", ticks: 30, build: function (s) {
    var o = { d: [] }, pos = [[16, 30], [124, 30], [16, 88], [124, 88]], lab = ["JOBS BOOKED", "QUOTES OUT", "CASH IN $K", "OVERDUE"];
    T(s, 16, 20, "THIS WEEK");
    o.lv = live(s, 214, 12); T(s, 208, 20, "06:00", "t-plate", "end");
    pos.forEach(function (p, i) {
      R(s, p[0], p[1], 100, 50, "f-b1");
      T(s, p[0] + 8, p[1] + 13, lab[i]);
      o.d.push(D(s, p[0] + 8, p[1] + 42, 2, 22, i === 3));
    });
    o.vals = [[14, 17, 19, 22, 24], [31, 29, 33, 30, 35], [48, 52, 57, 61, 66], [12, 9, 7, 4, 3]];
    return o;
  }, step: function (o, t) {
    var k = Math.min(4, Math.floor(t / 5));
    o.d.forEach(function (d, i) { d.set(o.vals[i][k], t); });
    pulse(o.lv, t);
  } });

  def("spreadsheet-rebuild", { label: "Spreadsheet rebuild: the workbook rebuilt with inputs and calculations separated", ticks: 34, build: function (s) {
    var o = { cells: [] };
    o.h1 = T(s, 30, 28, "INPUTS"); o.h2 = T(s, 102, 28, "CALCULATED");
    for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) {
      var cell = R(s, 30 + c * 36, 34 + r * 16, 34, 14, (r * 7 + c * 3) % 4 === 0 ? "f-mut" : "f-b1 s-rule");
      o.cells.push({ e: cell, r: r, c: c, ox: ((r * 37 + c * 17) % 21) - 10, oy: ((r * 13 + c * 29) % 13) - 6 });
    }
    T(s, 30, 138, "COPY-PASTE STEPS");
    o.d = D(s, 168, 142, 2, 18, true);
    return o;
  }, step: function (o, t) {
    o.cells.forEach(function (c) {
      var aligned = t >= 6 + c.r * 2;
      tr(c.e, aligned ? 0 : c.ox, aligned ? 0 : c.oy);
      var cls = t >= 18 ? (c.c === 0 ? "f-b0 s-ink" : "f-hair s-rule") : ((c.r * 7 + c.c * 3) % 4 === 0 ? "f-mut" : "f-b1 s-rule");
      if (c.e.getAttribute("class") !== cls) c.e.setAttribute("class", cls);
    });
    op(o.h1, on(t, 18)); op(o.h2, on(t, 18));
    var seq = [14, 10, 6, 3, 0];
    o.d.set(t < 20 ? 14 : seq[Math.min(4, Math.floor((t - 18) / 2))], t);
  } });

  def("cashflow", { label: "Cash-flow forecast: thirteen weeks ahead, with the short weeks named", ticks: 34, build: function (s) {
    var o = { bars: [] }, vals = [26, 20, 12, -10, -16, 4, 14, 22, 18, 10, 24, 32, 28];
    T(s, 16, 20, "13-WEEK CASH FORECAST");
    L(s, 20, 92, 224, 92, "s-rule");
    vals.forEach(function (v, i) {
      var x = 24 + i * 15;
      o.bars.push(v >= 0 ? R(s, x, 92 - v, 11, v, "f-ink o-b") : R(s, x, 92, 11, -v, "f-b0 s-ink o-t"));
    });
    T(s, 24, 120, "W1"); T(s, 224, 120, "W13", "t-plate", "end");
    o.note = T(s, 16, 140, "WEEKS 4–5 SHORT · CHASE 3 INVOICES", "t-plate f-ink");
    return o;
  }, step: function (o, t) {
    o.bars.forEach(function (b, i) { sy(b, t >= 3 + i ? 1 : 0); });
    op(o.note, on(t, 18));
  } });

  def("utilisation", { label: "Utilisation report: billable against non-billable hours per person", ticks: 30, build: function (s) {
    var o = { rows: [] }, names = ["ENG 1", "ENG 2", "ENG 3", "DRAFT", "ADMIN"], b = [.72, .64, .81, .55, .18], n = [.18, .22, .12, .30, .70];
    T(s, 16, 20, "BILLABLE / NON-BILLABLE · THIS MONTH");
    names.forEach(function (nm, i) {
      var y = 32 + i * 21;
      T(s, 16, y + 8, nm, "t-fig-s");
      R(s, 60, y, 136, 10, "f-b1");
      var bb = R(s, 60, y, 136 * b[i], 10, "f-ink o-l");
      var nb = R(s, 60 + 136 * b[i], y, 136 * n[i], 10, "f-rule o-l");
      var pc = T(s, 232, y + 8, Math.round(b[i] * 100) + "%", "t-fig-s", "end");
      o.rows.push({ bb: bb, nb: nb, pc: pc });
    });
    T(s, 16, 140, "COUNTED FROM TIMESHEETS · NOT BY HAND");
    return o;
  }, step: function (o, t) {
    o.rows.forEach(function (r) { sx(r.bb, pr(t, 2, 12)); sx(r.nb, pr(t, 12, 18)); op(r.pc, on(t, 18)); });
  } });

  /* ---------------- 02 CLEAR ---------------- */
  def("job-to-invoice", { label: "Job-to-invoice link: a finished job writes its own invoice", ticks: 36, build: function (s) {
    var o = { m: [] }, w = [60, 44, 52, 36];
    T(s, 16, 22, "JOB · COMPLETE"); T(s, 140, 22, "INVOICE · DRAFT");
    R(s, 16, 28, 84, 76, "f-b1 s-rule"); R(s, 140, 28, 84, 76, "f-b1 s-rule");
    L(s, 104, 66, 136, 66, "s-dash");
    w.forEach(function (wi, i) {
      var y = 40 + i * 15;
      R(s, 24, y, wi, 6, "f-ink");
      R(s, 148, y, 68, 6, "f-hair");
      var mv = R(s, 24, y, wi, 6, "f-ink"); dur(mv, 540);
      o.m.push(mv);
    });
    T(s, 16, 132, "KEYSTROKES PER INVOICE");
    o.d = D(s, 176, 138, 2, 22, true);
    return o;
  }, step: function (o, t) {
    var arrived = 0;
    o.m.forEach(function (m, i) { var k = 6 + i * 4; tr(m, t >= k ? 124 : 0, 0); if (t >= k + 3) arrived++; });
    o.d.set([46, 35, 23, 12, 0][arrived], t);
  } });

  def("inbox-intake", { label: "Inbox intake: a crew unit files bills and enquiries from the inbox", ticks: 40, build: function (s) {
    var o = { rows: [] };
    T(s, 16, 22, "INBOX");
    o.lv = live(s, 140, 13); T(s, 154, 21, "UNIT 03 / INTAKE"); T(s, 154, 32, "NOT A PERSON.");
    T(s, 140, 54, "FILED · SHAREPOINT"); T(s, 140, 112, "DRAFT BILLS · XERO");
    var slots = [60, 74, 88], dslots = [118, 132], fi = 0, di = 0;
    for (var i = 0; i < 5; i++) {
      var y = 30 + i * 16, g = G(s);
      R(g, 16, y, 76, 12, "f-b1 s-rule"); R(g, 22, y + 4, 44, 4, "f-mut");
      dur(g, 540);
      var ty = i % 2 === 0 ? slots[fi++] : dslots[di++];
      o.rows.push({ g: g, dx: 124, dy: ty - y });
    }
    T(s, 16, 128, "WAITING");
    o.d = D(s, 16, 146, 2, 16, true);
    return o;
  }, step: function (o, t) {
    var moved = 0;
    o.rows.forEach(function (r, i) { var k = 6 + i * 5; tr(r.g, t >= k ? r.dx : 0, t >= k ? r.dy : 0); if (t >= k + 3) moved++; });
    o.d.set(5 - moved, t);
    pulse(o.lv, t);
  } });

  def("approvals", { label: "Approvals routing: the request goes to the right person and is logged", ticks: 34, build: function (s) {
    var o = {}, xs = [20, 100, 180], lab = ["REQUEST", "APPROVER", "LOG"];
    xs.forEach(function (x, i) {
      R(s, x, 38, 40, 30, "f-b1 s-rule", 3);
      T(s, x + 20, 82, lab[i], "t-plate", "middle");
      if (i < 2) L(s, x + 40, 53, x + 80, 53, "s-rule");
    });
    o.card = R(s, 28, 46, 24, 14, "f-ink"); dur(o.card, 540);
    o.ok = T(s, 120, 30, "APPROVED · 1 TAP", "t-plate f-ink", "middle");
    o.log = T(s, 20, 108, "PO 2231 / APPROVED / 09:14", "t-fig-s");
    T(s, 20, 132, "TIME WAITING");
    o.was = T(s, 110, 134, "3 DAYS", "t-fig");
    o.strike = L(s, 108, 130, 160, 130, "s-sig");
    return o;
  }, step: function (o, t) {
    tr(o.card, t >= 16 ? 160 : t >= 6 ? 80 : 0, 0);
    op(o.ok, on(t, 10)); op(o.log, on(t, 19));
    op(o.strike, t >= 20 && t < 23 ? 1 : 0);
    txt(o.was, t >= 23 ? "4 MIN" : "3 DAYS");
  } });

  def("document-generation", { label: "Document generation: the form fills the quote, named and filed", ticks: 36, build: function (s) {
    var o = { v: [], lines: [] }, labs = ["CLIENT", "SITE", "SCOPE", "TOTAL"], vw = [60, 48, 70, 34], lw = [72, 64, 70, 50, 72, 40, 60];
    T(s, 16, 20, "FORM");
    labs.forEach(function (l, i) {
      T(s, 16, 36 + i * 24, l);
      R(s, 16, 40 + i * 24, 84, 11, "f-b1 s-rule");
      o.v.push(R(s, 20, 43.5 + i * 24, vw[i], 4, "f-ink o-l"));
    });
    R(s, 132, 14, 92, 118, "f-b1 s-rule");
    o.head = R(s, 140, 22, 18, 6, "f-ink");
    o.ref = T(s, 216, 28, "QUOTE 0192", "t-plate", "end");
    lw.forEach(function (w, i) { o.lines.push(R(s, 140, 40 + i * 10, w, 3, "f-mut o-l")); });
    o.tot = R(s, 184, 118, 32, 6, "f-ink o-l");
    o.filed = T(s, 132, 146, "FILED · Q-0192.PDF", "t-plate f-ink");
    return o;
  }, step: function (o, t) {
    o.v.forEach(function (e, i) { sx(e, on(t, 2 + i * 2)); });
    op(o.head, on(t, 11)); op(o.ref, on(t, 11));
    o.lines.forEach(function (e, i) { sx(e, on(t, 12 + i)); });
    sx(o.tot, on(t, 20)); op(o.filed, on(t, 24));
  } });

  def("systems-link", { label: "Systems link-up: one record kept in step across every system", ticks: 36, build: function (s) {
    var o = { solid: [] }, boxes = [["CRM", 16, 18], ["JOBS", 164, 18], ["ACCOUNTS", 16, 94], ["FILES", 164, 94]];
    var cx = 120, cy = 69;
    o.targets = [];
    boxes.forEach(function (b) {
      var bx = b[1] + 30, by = b[2] + 14;
      L(s, cx, cy, bx, by, "s-dash");
      o.solid.push(L(s, cx, cy, bx, by, "s-ink"));
      o.targets.push([bx - cx, by - cy]);
    });
    boxes.forEach(function (b) { R(s, b[1], b[2], 60, 28, "f-b1 s-rule"); T(s, b[1] + 30, b[2] + 17, b[0], "t-plate f-ink", "middle"); });
    R(s, cx - 7, cy - 7, 14, 14, "f-ink");
    o.dot = R(s, cx - 3, cy - 3, 6, 6, "f-read"); dur(o.dot, 360);
    T(s, 16, 140, "COPIES OF EACH CUSTOMER");
    o.d = D(s, 168, 145, 1, 18, true);
    return o;
  }, step: function (o, t) {
    o.solid.forEach(function (l, i) { op(l, on(t, 2 + i * 2)); });
    var p = t - 10, k = Math.floor(p / 4) % 4, ph = p % 4;
    if (t >= 10 && t < 26 && ph < 2) tr(o.dot, o.targets[k][0], o.targets[k][1]); else tr(o.dot, 0, 0);
    o.d.set(t < 20 ? 4 : Math.max(1, 4 - Math.floor((t - 17) / 3)), t);
  } });

  def("reconciliation", { label: "Overnight reconciliation: a crew unit matches the bank feed before morning", ticks: 42, build: function (s) {
    var o = { pairs: [] };
    o.lv = live(s, 16, 12); T(s, 30, 20, "UNIT 07 / RECONCILE");
    o.clock = T(s, 224, 21, "02:00", "t-fig", "end");
    T(s, 16, 40, "BANK"); T(s, 140, 40, "LEDGER");
    o.bank = []; o.led = [];
    for (var i = 0; i < 6; i++) o.bank.push(R(s, 16, 46 + i * 13, 84, 9, "f-b1 s-rule"));
    for (var j = 0; j < 5; j++) o.led.push(R(s, 140, 46 + j * 13, 84, 9, "f-b1 s-rule"));
    var map = [[0, 2], [1, 0], [2, 4], [4, 1], [5, 3]];
    map.forEach(function (m) {
      o.pairs.push({ b: m[0], l: m[1], line: L(s, 100, 50.5 + m[0] * 13, 140, 50.5 + m[1] * 13, "s-ink") });
    });
    o.exc = T(s, 16, 140, "1 EXCEPTION FOR 7AM", "t-plate f-ink");
    T(s, 170, 128, "UNMATCHED");
    o.d = D(s, 170, 146, 2, 16, true);
    o.times = ["02:00", "02:40", "03:20", "04:10", "05:00", "05:40"];
    return o;
  }, step: function (o, t) {
    txt(o.clock, o.times[Math.min(5, Math.floor(t / 6))]);
    var cleared = 0;
    o.pairs.forEach(function (p, k) {
      var a = 6 + k * 5;
      op(p.line, t >= a + 2 ? 0.15 : on(t, a));
      var dim = t >= a + 2 ? 0.25 : 1;
      op(o.bank[p.b], dim); op(o.led[p.l], dim);
      if (t >= a + 2) cleared++;
    });
    o.bank[3].setAttribute("class", t >= 32 ? "f-b1 s-ink" : "f-b1 s-rule");
    op(o.exc, on(t, 32));
    o.d.set(6 - cleared, t);
    pulse(o.lv, t);
  } });

  def("onboarding", { label: "Client onboarding run: one form sets up the folder, contact, email and tasks", ticks: 32, build: function (s) {
    var o = { v: [], out: [] }, labs = ["FOLDER CREATED", "CONTACT ADDED", "WELCOME EMAIL", "TASKS ASSIGNED"];
    R(s, 16, 22, 84, 96, "f-b1 s-rule");
    T(s, 24, 36, "NEW CLIENT");
    for (var i = 0; i < 3; i++) { R(s, 24, 44 + i * 14, 68, 8, "f-hair"); o.v.push(R(s, 26, 46 + i * 14, [50, 38, 56][i], 4, "f-ink o-l")); }
    o.key = keycap(s, 24, 96, 48, 14, "SUBMIT");
    labs.forEach(function (l, i) {
      var g = G(s), y = 22 + i * 22;
      R(g, 112, y, 112, 16, "f-b1 s-rule");
      T(g, 120, y + 10.5, l, "t-plate f-ink");
      T(g, 216, y + 11, "/", "t-fig", "end");
      o.out.push(g);
    });
    T(s, 112, 132, "STEPS BY HAND");
    o.d = D(s, 112, 146, 2, 16, true);
    return o;
  }, step: function (o, t) {
    o.v.forEach(function (e, i) { sx(e, on(t, 1 + i)); });
    press(o.key, t, 5);
    var n = 0;
    o.out.forEach(function (g, i) { appear(g, t, 7 + i * 3, -8, 0); if (t >= 7 + i * 3) n++; });
    o.d.set(20 - n * 5, t);
  } });

  def("lead-research", { label: "Lead research run: businesses researched, scored and ranked", ticks: 36, build: function (s) {
    var o = { rows: [] }, sc = [52, 88, 35, 71, 64, 91];
    T(s, 16, 20, "RESEARCHED · SCORED · RANKED");
    var order = sc.map(function (v, i) { return [v, i]; }).sort(function (a, b) { return b[0] - a[0]; });
    sc.forEach(function (v, i) {
      var y = 30 + i * 18, g = G(s);
      T(g, 16, y + 9, "LEAD " + (i + 1 < 10 ? "0" : "") + (i + 1), "t-fig-s");
      R(g, 64, y + 2, 110, 8, "f-b1");
      var bar = R(g, 64, y + 2, 110 * v / 100, 8, "f-ink o-l");
      var num = T(g, 196, y + 9, String(v), "t-fig-s", "end");
      var tier = T(g, 224, y + 9, v >= 85 ? "A" : v >= 60 ? "B" : "C", "t-plate f-ink", "end");
      dur(g, 540);
      var rank = 0; order.forEach(function (o2, r) { if (o2[1] === i) rank = r; });
      o.rows.push({ g: g, bar: bar, num: num, tier: tier, dy: (rank - i) * 18 });
    });
    return o;
  }, step: function (o, t) {
    o.rows.forEach(function (r) {
      sx(r.bar, pr(t, 2, 10)); op(r.num, on(t, 10));
      tr(r.g, 0, t >= 14 ? r.dy : 0);
      op(r.tier, on(t, 20));
    });
  } });

  /* ---------------- 03 BUILD ---------------- */
  def("quote-booking-form", { label: "Online quote and booking form: photos attached, job created, no phone call", ticks: 36, build: function (s) {
    var o = { v: [], old: [] };
    R(s, 20, 8, 76, 136, "f-b1 s-rule", 6);
    T(s, 30, 26, "BOOK A JOB");
    for (var i = 0; i < 3; i++) { R(s, 30, 32 + i * 15, 56, 10, "f-b0 s-rule"); o.v.push(R(s, 33, 35.5 + i * 15, [40, 30, 46][i], 3, "f-ink o-l")); }
    T(s, 30, 86, "PHOTOS");
    o.p1 = G(s); R(o.p1, 30, 90, 24, 20, "f-mut"); L(o.p1, 30, 110, 54, 90, "s-hair");
    o.p2 = G(s); R(o.p2, 60, 90, 24, 20, "f-mut"); L(o.p2, 60, 110, 84, 90, "s-hair");
    o.key = keycap(s, 30, 120, 56, 14, "SEND");
    T(s, 112, 26, "JOBS");
    for (var j = 0; j < 3; j++) { var g = G(s); R(g, 112, 32 + j * 16, 112, 12, "f-b1 s-rule"); R(g, 118, 36.5 + j * 16, 50, 3, "f-mut"); o.old.push(g); }
    o.nw = G(s); R(o.nw, 112, 32, 112, 12, "f-b0 s-ink"); T(o.nw, 118, 40.5, "J-0431 · 2 PHOTOS", "t-fig-s");
    o.note = T(s, 112, 132, "NO PHONE CALL NEEDED", "t-plate f-ink");
    return o;
  }, step: function (o, t) {
    o.v.forEach(function (e, i) { sx(e, on(t, 2 + i * 2)); });
    appear(o.p1, t, 8, 0, -8); appear(o.p2, t, 10, 0, -8);
    press(o.key, t, 13);
    o.old.forEach(function (g) { tr(g, 0, t >= 15 ? 16 : 0); });
    appear(o.nw, t, 15, -16, 0);
    op(o.note, on(t, 19));
  } });

  def("website-build", { label: "Website build: the page assembled block by block, built in code", ticks: 30, build: function (s) {
    var o = { b: [] };
    R(s, 16, 10, 208, 130, "f-b1 s-rule");
    R(s, 16, 10, 208, 12, "f-b0 s-rule");
    for (var i = 0; i < 3; i++) R(s, 22 + i * 7, 14, 4, 4, "f-mut");
    R(s, 52, 13.5, 120, 5, "f-hair");
    var nav = G(s); R(nav, 24, 28, 30, 5, "f-ink"); for (var n = 0; n < 4; n++) R(nav, 150 + n * 17, 29, 12, 3, "f-mut");
    var hero = G(s); R(hero, 24, 40, 192, 42, "f-b0 s-hair"); R(hero, 32, 49, 110, 8, "f-ink"); R(hero, 32, 60, 80, 8, "f-ink"); keycap(hero, 32, 72, 34, 7, "QUOTE");
    o.b.push([nav, 3], [hero, 6]);
    for (var c = 0; c < 3; c++) { var card = G(s); R(card, 24 + c * 66, 90, 60, 30, "f-b0 s-hair"); R(card, 30 + c * 66, 96, 30, 4, "f-ink"); R(card, 30 + c * 66, 104, 44, 3, "f-mut"); R(card, 30 + c * 66, 110, 36, 3, "f-mut"); o.b.push([card, 9 + c * 2]); }
    var foot = G(s); R(foot, 16, 126, 208, 14, "f-hair"); R(foot, 24, 131, 40, 3, "f-mut");
    o.b.push([foot, 16]);
    return o;
  }, step: function (o, t) {
    o.b.forEach(function (b) { appear(b[0], t, b[1], 0, 6); });
  } });

  def("website-quiz", { label: "Website quiz: nine answers in, a written recommendation out", ticks: 36, build: function (s) {
    var o = { cells: [], chips: [] };
    for (var i = 0; i < 9; i++) { R(s, 16 + i * 13, 12, 11, 6, "f-hair"); o.cells.push(R(s, 16 + i * 13, 12, 11, 6, "f-ink")); }
    R(s, 16, 26, 120, 112, "f-b1 s-rule");
    o.q = T(s, 24, 40, "QUESTION 1 / 9");
    R(s, 24, 48, 96, 5, "f-ink"); R(s, 24, 57, 70, 5, "f-ink");
    for (var c = 0; c < 4; c++) o.chips.push(R(s, 24, 72 + c * 15, 104, 11, "f-b0 s-rule"));
    o.res = G(s);
    R(o.res, 146, 26, 78, 112, "f-b0 s-ink");
    T(o.res, 154, 40, "YOUR RESULT");
    for (var r = 0; r < 3; r++) { T(o.res, 154, 60 + r * 24, String(r + 1), "t-fig"); R(o.res, 166, 52 + r * 24, 50, 5, "f-ink"); R(o.res, 166, 61 + r * 24, 34, 3, "f-mut"); }
    return o;
  }, step: function (o, t) {
    var q = Math.max(1, Math.min(9, 1 + Math.floor((t - 2) / 2)));
    o.cells.forEach(function (e, i) { op(e, on(t, 3 + i * 2)); });
    txt(o.q, t >= 20 ? "COMPLETE" : "QUESTION " + q + " / 9");
    var pick = t < 2 || t >= 20 ? -1 : (q * 3) % 4;
    o.chips.forEach(function (e, i) { var cls = i === pick ? "f-ink" : "f-b0 s-rule"; if (e.getAttribute("class") !== cls) e.setAttribute("class", cls); });
    appear(o.res, t, 22, 10, 0);
  } });

  def("job-time-app", { label: "Job and time tracking app: time and materials logged against the job", ticks: 38, build: function (s) {
    var o = {};
    R(s, 20, 8, 80, 136, "f-b1 s-rule", 6);
    T(s, 30, 26, "J-0417");
    o.h = D(s, 30, 62, 2, 24); T(s, 60, 60, ":", "t-fig"); o.m = D(s, 68, 62, 2, 24);
    T(s, 30, 84, "MATERIALS");
    o.mat = R(s, 30, 89, 60, 5, "f-ink o-l");
    o.ph = G(s); R(o.ph, 30, 100, 26, 18, "f-mut"); L(o.ph, 30, 118, 56, 100, "s-hair");
    o.key = keycap(s, 30, 124, 60, 12, "STOP");
    T(s, 116, 36, "JOB COST · J-0417");
    R(s, 116, 44, 108, 10, "f-b1");
    o.bar = R(s, 116, 44, 108, 10, "f-ink o-l");
    o.lab = G(s); T(o.lab, 116, 70, "LABOUR"); T(o.lab, 224, 70, "2H 15M", "t-fig-s", "end");
    o.log = T(s, 116, 92, "LOGGED · NO TIMESHEET", "t-plate f-ink");
    return o;
  }, step: function (o, t) {
    var mins = Math.min(135, t * 6);
    o.h.set(Math.floor(mins / 60), t); o.m.set(mins % 60, t);
    sx(o.mat, on(t, 8)); appear(o.ph, t, 12, 0, -6);
    press(o.key, t, 24);
    sx(o.bar, t >= 26 ? 0.62 : 0.35);
    op(o.lab, on(t, 26)); op(o.log, on(t, 28));
  } });

  def("client-portal", { label: "Client portal: clients see where their job is up to", ticks: 34, build: function (s) {
    var o = { fill: [], link: [] }, lab = ["QUOTED", "BOOKED", "ON SITE", "DONE"];
    R(s, 16, 10, 208, 100, "f-b1 s-rule");
    T(s, 24, 26, "JOB 0417 · YOUR PORTAL");
    lab.forEach(function (l, i) {
      var x = 28 + i * 58;
      if (i < 3) { L(s, x + 12, 46, x + 58, 46, "s-hair"); o.link.push(L(s, x + 12, 46, x + 58, 46, "s-ink")); }
      R(s, x, 40, 12, 12, "f-b0 s-rule");
      o.fill.push(R(s, x, 40, 12, 12, "f-ink"));
      T(s, x + 6, 66, l, "t-plate", "middle");
    });
    o.doc = G(s); R(o.doc, 28, 80, 184, 14, "f-b0 s-hair"); T(o.doc, 34, 89.5, "INVOICE-2231.PDF", "t-fig-s"); T(o.doc, 206, 89.5, "VIEW", "t-plate f-ink", "end");
    T(s, 16, 128, "CALLS ASKING FOR AN UPDATE");
    o.d = D(s, 16, 146, 1, 16, true);
    return o;
  }, step: function (o, t) {
    o.fill.forEach(function (e, i) { op(e, on(t, 3 + i * 5)); });
    o.link.forEach(function (e, i) { op(e, on(t, 5 + i * 5)); });
    appear(o.doc, t, 20, 0, 6);
    o.d.set(t < 4 ? 6 : Math.max(0, 6 - Math.floor((t - 2) / 3)), t);
  } });

  def("quote-calculator", { label: "Quote calculator: the business's own rates turn inputs into a quote", ticks: 36, build: function (s) {
    var o = { v: [] }, lab = ["METRES", "GATES", "HEIGHT"], val = ["24", "2", "1.8 M"];
    lab.forEach(function (l, i) {
      T(s, 16, 26 + i * 26, l);
      R(s, 16, 30 + i * 26, 70, 13, "f-b1 s-rule");
      o.v.push(T(s, 22, 39.5 + i * 26, val[i], "t-fig-s"));
    });
    T(s, 104, 26, "QUOTE TOTAL");
    T(s, 104, 58, "$", "t-fig");
    o.d = D(s, 114, 60, 4, 24);
    o.pdf = G(s); R(o.pdf, 104, 74, 56, 66, "f-b1 s-rule"); R(o.pdf, 110, 82, 26, 5, "f-ink"); for (var i = 0; i < 4; i++) R(o.pdf, 110, 94 + i * 8, 40 - i * 6, 3, "f-mut"); T(o.pdf, 110, 134, "QUOTE.PDF");
    T(s, 170, 90, "QUOTE TIME");
    o.was = T(s, 170, 110, "45 MIN", "t-fig");
    o.strike = L(s, 168, 106, 220, 106, "s-sig");
    return o;
  }, step: function (o, t) {
    o.v.forEach(function (e, i) { op(e, on(t, 2 + i * 2)); });
    o.d.set(t >= 13 ? 4860 : t >= 11 ? 3240 : t >= 9 ? 1620 : 0, t);
    appear(o.pdf, t, 16, 0, 6);
    op(o.strike, t >= 18 && t < 21 ? 1 : 0);
    txt(o.was, t >= 21 ? "1 MIN" : "45 MIN");
  } });

  def("analytics", { label: "Cookie-free site analytics: which pages bring in enquiries", ticks: 32, build: function (s) {
    var o = { bars: [], nums: [] }, pages = ["/", "/SERVICES", "/QUOTE", "/CONTACT"], v = [.9, .55, .7, .3], n = [18, 11, 14, 6];
    T(s, 16, 20, "ENQUIRIES BY PAGE · THIS MONTH");
    pages.forEach(function (p, i) {
      var y = 32 + i * 17;
      T(s, 16, y + 8, p, "t-fig-s");
      o.bars.push([R(s, 76, y, 120 * v[i], 9, "f-ink o-l")]);
      o.nums.push(T(s, 224, y + 8, String(n[i]), "t-fig-s", "end"));
    });
    T(s, 16, 112, "VISITS · 30 DAYS");
    var pts = [], i2;
    for (i2 = 0; i2 < 14; i2++) pts.push((96 + i2 * 9.5) + "," + (122 - [4, 7, 5, 9, 8, 12, 10, 14, 13, 17, 15, 19, 18, 22][i2]));
    o.sp = E("polyline", { points: pts.join(" "), "class": "s-ink f-none sline" }, s);
    o.sp.style.strokeDasharray = "200"; o.sp.style.strokeDashoffset = "200";
    T(s, 16, 142, "COOKIES SET"); T(s, 96, 143, "0", "t-fig");
    return o;
  }, step: function (o, t) {
    var p = pr(t, 2, 12);
    o.bars.forEach(function (b) { sx(b[0], p); });
    o.nums.forEach(function (e) { op(e, on(t, 12)); });
    o.sp.style.strokeDashoffset = t >= 12 ? "0" : "200";
  } });

  /* ---------------- 04 FACE ---------------- */
  def("identity-refresh", { label: "Identity refresh: a new mark drawn on a grid, with palette and type", ticks: 34, build: function (s) {
    var o = { pieces: [], sw: [] };
    T(s, 16, 20, "BEFORE");
    var old = G(s);
    E("rect", { x: 22, y: 40, width: 34, height: 24, "class": "f-mut", transform: "rotate(-8 39 52)" }, old);
    E("rect", { x: 44, y: 54, width: 28, height: 20, "class": "f-b1 s-rule", transform: "rotate(6 58 64)" }, old);
    R(old, 26, 84, 46, 4, "f-mut"); R(old, 30, 92, 30, 3, "f-hair");
    o.old = old;
    L(s, 84, 70, 104, 70, "s-dash");
    o.after = T(s, 112, 20, "AFTER");
    o.grid = G(s);
    for (var gx = 0; gx <= 8; gx++) L(o.grid, 112 + gx * 14, 26, 112 + gx * 14, 110, "s-hair");
    for (var gy = 0; gy <= 6; gy++) L(o.grid, 112, 26 + gy * 14, 224, 26 + gy * 14, "s-hair");
    var parts = [[140, 40, 56, 56, "f-rule", 6, -18, -10], [140, 38, 56, 56, "f-read", 6, 0, -16], [152, 52, 32, 6, "f-b0", 0, 18, 0], [152, 64, 24, 6, "f-b0", 0, -16, 6], [152, 76, 14, 6, "f-b0", 0, 12, 10]];
    parts.forEach(function (p) { var r = R(s, p[0], p[1], p[2], p[3], p[4], p[5]); o.pieces.push([r, p[6], p[7]]); });
    ["f-ink", "f-read", "f-rule", "f-mut"].forEach(function (c, i) { o.sw.push(R(s, 112 + i * 16, 122, 12, 12, c)); });
    o.type = T(s, 224, 133, "AA 01", "t-fig", "end");
    return o;
  }, step: function (o, t) {
    op(o.old, t >= 26 ? 0.35 : 1);
    op(o.after, on(t, 4)); op(o.grid, on(t, 4));
    o.pieces.forEach(function (p, i) { var k = 8 + i * 2; op(p[0], on(t, k)); tr(p[0], t >= k ? 0 : p[1], t >= k ? 0 : p[2]); });
    o.sw.forEach(function (e, i) { op(e, on(t, 19 + i)); });
    op(o.type, on(t, 24));
  } });

  def("tender-pack", { label: "Tender and capability pack: reusable answers fill the next tender", ticks: 36, build: function (s) {
    var o = { m: [] };
    T(s, 16, 20, "ANSWER BANK");
    for (var i = 0; i < 6; i++) { R(s, 16, 28 + i * 14, 64, 10, "f-b1 s-rule"); R(s, 20, 31 + i * 14, 40, 4, "f-mut"); }
    R(s, 120, 12, 104, 118, "f-b1 s-rule");
    R(s, 128, 20, 48, 6, "f-ink"); T(s, 216, 26, "TENDER", "t-plate", "end");
    for (var j = 0; j < 6; j++) R(s, 128, 40 + j * 14, 88, 9, "f-hair");
    for (var k = 0; k < 5; k++) { var mv = R(s, 16, 28 + k * 14, 64, 10, "f-ink"); dur(mv, 540); o.m.push(mv); }
    T(s, 16, 128, "PRE-WRITTEN");
    o.d = D(s, 16, 146, 2, 16); T(s, 38, 145, "%", "t-fig-s");
    return o;
  }, step: function (o, t) {
    var n = 0;
    o.m.forEach(function (e, i) { var k = 4 + i * 3; op(e, on(t, k)); tr(e, t >= k ? 112 : 0, t >= k ? 12 : 0); if (t >= k + 3) n++; });
    o.d.set(n * 16, t);
  } });

  def("templates", { label: "Document and stationery templates: every document from one system", ticks: 30, build: function (s) {
    var o = { docs: [] }, off = [[10, 8, .6], [0, 14, 1.3], [16, 2, .8]], foff = [6, -8, 4], names = ["QUOTE", "REPORT", "LETTER"];
    for (var i = 0; i < 3; i++) {
      var x = 16 + i * 76, y = 18;
      R(s, x, y, 56, 84, "f-b1 s-rule");
      var head = R(s, x + 6, y + 6, 30, 6, "f-mut o-l");
      for (var j = 0; j < 5; j++) R(s, x + 6, y + 22 + j * 8, 44 - (j % 2) * 10, 3, "f-hair");
      var foot = L(s, x + 6, y + 76, x + 50, y + 76, "s-rule");
      T(s, x + 28, 116, names[i], "t-plate", "middle");
      o.docs.push({ head: head, foot: foot, o: off[i], f: foff[i] });
    }
    o.note = T(s, 16, 140, "ONE SYSTEM · 3 TEMPLATES", "t-plate f-ink");
    return o;
  }, step: function (o, t) {
    o.docs.forEach(function (d, i) {
      var k = 8 + i * 2, a = t >= k;
      d.head.style.transform = a ? "translate(0px,0px) scaleX(1)" : "translate(" + d.o[0] + "px," + d.o[1] + "px) scaleX(" + d.o[2] + ")";
      var cls = a ? "f-ink o-l" : "f-mut o-l"; if (d.head.getAttribute("class") !== cls) d.head.setAttribute("class", cls);
      tr(d.foot, 0, a ? 0 : d.f);
    });
    op(o.note, on(t, 16));
  } });

  def("brand-redesign", { label: "Brand redesign: a new mark drawn on a grid, with palette and type", ticks: DEFS["identity-refresh"].ticks, build: DEFS["identity-refresh"].build, step: DEFS["identity-refresh"].step });

  def("style-guide", { label: "Style guide: logo, colour, type and usage rules on a few pages", ticks: 34, build: function (s) {
    var o = { spreads: [] };
    R(s, 24, 16, 94, 106, "f-b1 s-rule"); R(s, 122, 16, 94, 106, "f-b1 s-rule");
    L(s, 120, 16, 120, 122, "s-hair");
    var a = G(s);
    T(a, 32, 30, "01 LOGO");
    R(a, 49, 44, 44, 44, "f-rule", 6); R(a, 49, 42, 44, 44, "f-read", 6);
    R(a, 57, 52, 24, 5, "f-b0"); R(a, 57, 61, 18, 5, "f-b0"); R(a, 57, 70, 10, 5, "f-b0");
    T(a, 130, 30, "CLEAR SPACE");
    E("rect", { x: 140, y: 40, width: 58, height: 58, "class": "f-none s-dash" }, a);
    R(a, 154, 54, 30, 30, "f-read", 4);
    T(a, 169, 112, "1 KEY CLEAR", "t-plate", "middle");
    var b = G(s);
    T(b, 32, 30, "02 COLOUR");
    [["f-ink", "INK"], ["f-read", "READOUT"], ["f-rule", "RULE"], ["f-mut", "MUTED"]].forEach(function (c, i) {
      R(b, 32, 38 + i * 19, 14, 14, c[0]); T(b, 52, 48 + i * 19, c[1], "t-plate f-ink");
    });
    T(b, 130, 30, "03 TYPE");
    T(b, 130, 72, "AA", "t-fig").style.fontSize = "30px";
    R(b, 130, 84, 70, 4, "f-ink"); R(b, 130, 93, 58, 3, "f-mut"); R(b, 130, 101, 64, 3, "f-mut");
    var c2 = G(s);
    T(c2, 32, 30, "04 USAGE");
    R(c2, 40, 44, 54, 40, "f-b0 s-rule"); R(c2, 54, 54, 26, 20, "f-read", 3);
    T(c2, 67, 102, "/ RIGHT", "t-plate f-ink", "middle");
    T(c2, 130, 30, "05 NOT THIS");
    E("rect", { x: 140, y: 44, width: 54, height: 40, "class": "f-b0 s-rule" }, c2);
    E("rect", { x: 150, y: 50, width: 34, height: 20, "class": "f-mut", rx: 3, transform: "rotate(-12 167 60)" }, c2);
    T(c2, 167, 102, "× WRONG", "t-plate f-ink", "middle");
    o.spreads = [a, b, c2];
    o.page = T(s, 24, 140, "PAGE 02 / 12", "t-fig-s");
    return o;
  }, step: function (o, t) {
    var k = t < 11 ? 0 : t < 22 ? 1 : 2;
    o.spreads.forEach(function (g, i) { op(g, i === k ? 1 : 0); });
    txt(o.page, "PAGE " + ["02", "04", "06"][k] + " / 12");
  } });

  def("design-system", { label: "Design system: tokens become components, one source for every page", ticks: 36, build: function (s) {
    var o = { tok: [], comp: [], links: [] }, toks = [["f-ink", "INK"], ["f-read", "READOUT"], ["f-rule", "RULE"], ["f-b1 s-rule", "BASE-100"], ["f-mut", "SPACE-4"], ["f-mut", "RADIUS-3"]];
    T(s, 16, 18, "TOKENS"); T(s, 132, 18, "COMPONENTS");
    toks.forEach(function (tk, i) {
      var g = G(s), y = 24 + i * 14;
      R(g, 16, y, 10, 10, tk[0]); T(g, 32, y + 8, tk[1], "t-plate f-ink");
      o.tok.push(g);
    });
    [[96, 31, 132, 34], [96, 59, 132, 66], [96, 87, 132, 96]].forEach(function (l) { o.links.push(L(s, l[0], l[1], l[2], l[3], "s-dash")); });
    o.comp.push(keycap(s, 132, 26, 52, 14, "BUTTON"));
    var inp = G(s); R(inp, 132, 58, 92, 16, "f-b0 s-rule"); R(inp, 138, 64, 46, 4, "f-ink"); o.comp.push(inp);
    var card = G(s); R(card, 132, 84, 92, 28, "f-b1"); R(card, 140, 91, 36, 5, "f-ink"); R(card, 140, 100, 70, 3, "f-mut"); R(card, 140, 106, 52, 3, "f-mut"); o.comp.push(card);
    T(s, 16, 128, "ONE-OFF STYLES");
    o.d = D(s, 16, 146, 2, 16, true);
    o.note = T(s, 132, 138, "ONE SOURCE", "t-plate f-ink");
    return o;
  }, step: function (o, t) {
    o.tok.forEach(function (g, i) { appear(g, t, 2 + i, -6, 0); });
    o.links.forEach(function (l, i) { op(l, on(t, 10 + i)); });
    o.comp.forEach(function (g, i) { appear(g, t, 12 + i * 3, 0, 6); });
    var seq = [18, 12, 7, 3, 0];
    o.d.set(t < 20 ? 18 : seq[Math.min(4, Math.floor((t - 18) / 2))], t);
    op(o.note, on(t, 28));
  } });

  def("business-cards", { label: "Business cards: front and back in the brand, print-ready for every staff member", ticks: 34, build: function (s) {
    var o = {};
    o.stack = G(s);
    R(o.stack, 68, 36, 120, 73, "f-b0 s-hair"); R(o.stack, 64, 32, 120, 73, "f-b0 s-hair");
    o.front = G(s, "o-c");
    R(o.front, 60, 28, 120, 73, "f-b1 s-rule");
    R(o.front, 72, 40, 16, 16, "f-read", 3);
    R(o.front, 72, 72, 62, 5, "f-ink"); R(o.front, 72, 81, 40, 3, "f-mut"); R(o.front, 72, 88, 52, 3, "f-mut");
    o.back = G(s, "o-c");
    R(o.back, 60, 28, 120, 73, "f-read");
    R(o.back, 108, 50, 24, 5, "f-b0"); R(o.back, 108, 59, 18, 5, "f-b0"); R(o.back, 108, 68, 10, 5, "f-b0");
    o.crop = G(s);
    [[60, 28, -1, -1], [180, 28, 1, -1], [60, 101, -1, 1], [180, 101, 1, 1]].forEach(function (c) {
      L(o.crop, c[0] + c[2] * 3, c[1], c[0] + c[2] * 11, c[1], "s-rule");
      L(o.crop, c[0], c[1] + c[3] * 3, c[0], c[1] + c[3] * 11, "s-rule");
    });
    o.size = T(s, 120, 124, "90 × 55 MM · PRINT-READY", "t-plate f-ink", "middle");
    o.note = T(s, 120, 140, "1 TEMPLATE · EVERY STAFF MEMBER", "t-plate", "middle");
    return o;
  }, step: function (o, t) {
    var showBack = t >= 11 && t < 22;
    o.front.style.transform = "scaleX(" + (t >= 10 && t < 22 ? 0 : 1) + ")";
    o.back.style.transform = "scaleX(" + (showBack && t < 21 ? 1 : 0) + ")";
    op(o.crop, on(t, 24)); op(o.size, on(t, 25)); op(o.stack, on(t, 27)); op(o.note, on(t, 28));
  } });

  def("stationery", { label: "Stationery set: letterhead, compliments slip and envelope from one system", ticks: 32, build: function (s) {
    var o = { items: [] };
    var lh = G(s); R(lh, 20, 14, 74, 104, "f-b1 s-rule"); R(lh, 28, 22, 10, 10, "f-read", 2); R(lh, 72, 25, 16, 3, "f-mut");
    for (var i = 0; i < 6; i++) R(lh, 28, 46 + i * 9, 56 - (i % 3) * 10, 3, "f-hair");
    R(lh, 28, 108, 58, 2, "f-rule");
    var cs = G(s); R(cs, 106, 14, 112, 44, "f-b1 s-rule"); R(cs, 114, 22, 10, 10, "f-read", 2); R(cs, 132, 25, 40, 3, "f-mut"); R(cs, 114, 42, 70, 3, "f-hair");
    var en = G(s); R(en, 106, 66, 112, 52, "f-b1 s-rule"); R(en, 114, 74, 10, 10, "f-read", 2); R(en, 152, 92, 56, 18, "f-b0 s-hair");
    o.items = [[lh, 2], [cs, 6], [en, 10]];
    o.guide = L(s, 14, 27, 226, 27, "s-dash");
    o.n1 = T(s, 20, 134, "LETTERHEAD · COMPS SLIP · DL ENVELOPE", "t-plate f-ink");
    o.n2 = T(s, 20, 146, "PRINT-READY + EDITABLE WORD LETTERHEAD");
    return o;
  }, step: function (o, t) {
    o.items.forEach(function (it) { appear(it[0], t, it[1], 0, 8); });
    op(o.guide, t >= 16 && t < 26 ? 1 : 0);
    op(o.n1, on(t, 18)); op(o.n2, on(t, 22));
  } });

  def("email-signatures", { label: "Email signatures: one signature in the brand, installed in every mailbox", ticks: 36, build: function (s) {
    var o = { rows: [] }, mw = [[52, 30, "f-mut"], [70, 44, "f-rule"], [40, 58, "f-mut"], [60, 24, "f-rule"]];
    T(s, 16, 20, "MAILBOXES");
    mw.forEach(function (m, i) {
      var y = 26 + i * 22;
      R(s, 16, y, 104, 18, "f-b1 s-rule");
      var messy = G(s); R(messy, 22, y + 4, m[0], 4, m[2]); R(messy, 22, y + 11, m[1], 3, "f-hair");
      var clean = G(s); R(clean, 22, y + 4, 10, 10, "f-read", 2); R(clean, 36, y + 5, 40, 3, "f-ink"); R(clean, 36, y + 11, 28, 2, "f-mut");
      o.rows.push({ messy: messy, clean: clean });
    });
    o.prev = [];
    var box = G(s); R(box, 132, 26, 92, 84, "f-b0 s-hair"); o.prev.push(box);
    var a = G(s); R(a, 140, 36, 18, 18, "f-read", 3); o.prev.push(a);
    var b = G(s); R(b, 164, 38, 48, 5, "f-ink"); R(b, 164, 47, 34, 3, "f-mut"); o.prev.push(b);
    var c = G(s); L(c, 140, 64, 216, 64, "s-rule"); R(c, 140, 72, 60, 3, "f-mut"); R(c, 140, 80, 44, 3, "f-mut"); R(c, 140, 92, 70, 3, "f-hair"); o.prev.push(c);
    T(s, 16, 128, "SIGNATURE STYLES");
    o.d = D(s, 16, 146, 1, 16, true);
    o.note = G(s); T(o.note, 132, 128, "INSTALLED", "t-plate f-ink"); T(o.note, 132, 140, "OUTLOOK + GMAIL", "t-plate");
    return o;
  }, step: function (o, t) {
    o.prev.forEach(function (g, i) { appear(g, t, 2 + i * 2, 0, 4); });
    var sw = 0;
    o.rows.forEach(function (r, i) { var k = 12 + i * 3, d = t >= k; op(r.messy, d ? 0 : 1); op(r.clean, d ? 1 : 0); if (d) sw++; });
    o.d.set(4 - sw + (sw > 0 ? 1 : 0), t);
    op(o.note, on(t, 25));
  } });

  /* ---------------- player ---------------- */
  function build(host) {
    var d = DEFS[host.getAttribute("data-ks")];
    if (!d) return null;
    inject();
    host.classList.add("ks-anim");
    host.innerHTML = "";
    var svg = E("svg", { viewBox: "0 0 240 150", role: "img", "aria-label": d.label }, null);
    host.appendChild(svg);
    var st = d.build(svg);
    return { def: d, st: st, svg: svg, set: function (t) { d.step(st, t); } };
  }
  function mount(host) {
    if (host._ks) return host._ks;
    var c = build(host); if (!c) return null;
    var t = 0, timer = null, d = c.def;
    function reset() {
      host.classList.add("ks-reset"); t = 0; c.set(0);
      void host.getBoundingClientRect();
      requestAnimationFrame(function () { requestAnimationFrame(function () { host.classList.remove("ks-reset"); }); });
    }
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      host.classList.add("ks-reset");
      var hold = d.hold != null ? d.hold : d.ticks - 2;
      for (var k = 0; k <= hold; k++) c.set(k);
      return (host._ks = c);
    }
    reset();
    function tick() { t++; if (t >= d.ticks) { reset(); return; } c.set(t); }
    function play() { if (!timer) timer = setInterval(tick, TICK); }
    function stop() { clearInterval(timer); timer = null; }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? play() : stop(); }); }).observe(host);
    } else play();
    return (host._ks = c);
  }
  function mountAll(root) { (root || document).querySelectorAll("[data-ks]").forEach(mount); }
  window.KSAnim = { mount: mount, mountAll: mountAll, build: build, names: Object.keys(DEFS), defs: DEFS, TICK: TICK };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { mountAll(); });
  else mountAll();
})();

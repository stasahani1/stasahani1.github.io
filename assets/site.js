// Shared interactions for every page. Each piece only runs if its
// elements exist on the page, so this one file is safe to include everywhere.
(() => {
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const lerp = (a, b, t) => a + (b - a) * t;

    // ---------- Split headings into letters for the rise-in ----------
    document.querySelectorAll(".split").forEach(el => {
        let i = 0;
        const walk = node => {
            [...node.childNodes].forEach(child => {
                if (child.nodeType === 3) {
                    // Letters are grouped into words so lines only wrap between words
                    const frag = document.createDocumentFragment();
                    child.textContent.split(/(\s+)/).forEach(word => {
                        if (!word) return;
                        if (/^\s+$/.test(word)) { frag.append(" "); return; }
                        const wrap = document.createElement("span");
                        wrap.style.whiteSpace = "nowrap";
                        for (const c of word) {
                            const s = document.createElement("span");
                            s.className = "ch";
                            s.style.setProperty("--i", i++);
                            s.textContent = c;
                            wrap.append(s);
                        }
                        frag.append(wrap);
                    });
                    child.replaceWith(frag);
                } else if (child.nodeType === 1) {
                    walk(child);
                }
            });
        };
        el.setAttribute("aria-label", el.textContent.trim());
        walk(el);
    });

    // ---------- Reveal on scroll ----------
    const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
    }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll("[data-reveal]").forEach(el => io.observe(el));

    // ---------- Nav: frosted once scrolled, tucks away when scrolling down ----------
    const nav = document.querySelector(".site-nav");
    let lastY = scrollY;
    const onScroll = () => {
        const y = scrollY;
        if (nav) {
            nav.classList.toggle("scrolled", y > 30);
            nav.classList.toggle("hidden", y > 400 && y > lastY + 4);
            if (y < lastY - 4) nav.classList.remove("hidden");
        }
        lastY = y;
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // ---------- Cursor dot ----------
    if (finePointer && !reduceMotion) {
        const dot = document.createElement("div");
        dot.className = "cursor";
        document.body.append(dot);
        let x = -100, y = -100, cx = -100, cy = -100;
        addEventListener("pointermove", e => { x = e.clientX; y = e.clientY; dot.classList.add("on"); }, { passive: true });
        document.addEventListener("pointerleave", () => dot.classList.remove("on"));
        document.addEventListener("pointerover", e => {
            dot.classList.toggle("big", !!e.target.closest("a, button, [data-cursor]"));
        });
        (function tick() {
            cx = lerp(cx, x, 0.25); cy = lerp(cy, y, 0.25);
            dot.style.transform = `translate(${cx}px, ${cy}px)`;
            requestAnimationFrame(tick);
        })();
    }

    // ---------- Marquee: drifts on its own, speeds up and flips with your scroll ----------
    document.querySelectorAll(".marquee-track").forEach(track => {
        track.innerHTML += track.innerHTML; // duplicate for a seamless loop
        let pos = 0, dir = -1, boost = 0, prevY = scrollY;
        (function tick() {
            const dy = scrollY - prevY; prevY = scrollY;
            if (dy) dir = dy > 0 ? -1 : 1;
            boost = lerp(boost, Math.min(Math.abs(dy), 60) * 0.25, 0.1);
            pos += dir * (reduceMotion ? 0 : 0.6 + boost);
            const half = track.scrollWidth / 2;
            if (pos <= -half) pos += half;
            if (pos > 0) pos -= half;
            track.style.transform = `translate3d(${pos}px,0,0)`;
            requestAnimationFrame(tick);
        })();
    });

    // ---------- Typed interests ----------
    const typed = document.getElementById("typed");
    if (typed) {
        const words = JSON.parse(typed.dataset.words);
        let w = 0, c = 0, deleting = false;
        const step = () => {
            const word = words[w];
            c += deleting ? -1 : 1;
            typed.textContent = word.slice(0, c);
            let wait = deleting ? 40 : 85;
            if (!deleting && c === word.length) { deleting = true; wait = 1800; }
            else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; wait = 300; }
            setTimeout(step, wait);
        };
        if (reduceMotion) typed.textContent = words.join(", ");
        else step();
    }

    // ---------- Gentle 3D tilt ----------
    if (finePointer && !reduceMotion) {
        document.querySelectorAll("[data-tilt]").forEach(el => {
            el.addEventListener("pointermove", e => {
                const r = el.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top) / r.height - 0.5;
                el.style.transform = `perspective(900px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg) scale(1.02)`;
            });
            el.addEventListener("pointerleave", () => { el.style.transform = ""; });
        });
    }

    // ---------- Panels: remember where the pointer came in, for the glow ----------
    document.querySelectorAll("[data-bloom]").forEach(el => {
        const set = e => {
            const r = el.getBoundingClientRect();
            el.style.setProperty("--bx", `${e.clientX - r.left}px`);
            el.style.setProperty("--by", `${e.clientY - r.top}px`);
        };
        el.addEventListener("pointerenter", set);
        el.addEventListener("pointermove", set);
    });

    // Runs a draw loop only while its element is on screen
    const loop = (el, draw) => {
        let on = false;
        new IntersectionObserver(([e]) => { on = e.isIntersecting; }).observe(el);
        const t0 = performance.now();
        (function frame(now) {
            requestAnimationFrame(frame);
            if (on) draw(reduceMotion ? 0 : (now - t0) / 1000);
        })(t0);
    };
    const fitCanvas = cv => {
        const dpr = Math.min(devicePixelRatio || 1, 2);
        const r = cv.getBoundingClientRect();
        if (cv.width !== Math.round(r.width * dpr) || cv.height !== Math.round(r.height * dpr)) {
            cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
        }
        const ctx = cv.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return [ctx, r.width, r.height];
    };

    // ---------- Hero manifold: an iridescent wireframe landscape your cursor presses into ----------
    const hero = document.querySelector(".manifold-canvas");
    if (hero) {
        const COLS = 64, ROWS = 34;
        const IRIS = ["#5fd0c0", "#6f93c8", "#b79ce6", "#eab3a3", "#8bc78f"];
        let px = 0, pz = 2.2, tpx = 0, tpz = 2.2, depth = 0, active = false, cam = 0;
        const host = hero.parentElement;
        host.addEventListener("pointermove", e => { active = true; host._mx = e.clientX; host._my = e.clientY; });
        host.addEventListener("pointerleave", () => { active = false; });
        host.addEventListener("pointerdown", () => { depth = -1.4; }); // a click pops the dent outward
        // drifting points above the surface, like an embedding space
        const motes = Array.from({ length: 70 }, (_, i) => ({
            x: (Math.random() - 0.5) * 7, y: 0.3 + Math.random() * 1.3, z: 1.2 + Math.random() * 7,
            ph: Math.random() * 6.28, c: IRIS[i % IRIS.length],
        }));
        loop(host, t => {
            const [ctx, W, H] = fitCanvas(hero);
            const horizon = H * 0.4, f = W * 0.55, camH = 1.25;
            const r = hero.getBoundingClientRect();
            cam = lerp(cam, active ? ((host._mx - r.left) / W - 0.5) * -0.6 : Math.sin(t * 0.1) * 0.2, 0.03);
            const cx = W / 2;
            const project = (x, y, z) => [cx + ((x + cam) * f) / z, horizon + ((camH - y) * f) / z];
            if (active) {
                const sx = host._mx - r.left, sy = Math.max(host._my - r.top, horizon + 20);
                tpz = Math.min(6, (camH * f) / (sy - horizon)); tpx = ((sx - cx) * tpz) / f - cam;
            } else {
                tpx = Math.sin(t * 0.25) * 1.6; tpz = 2.4 + Math.sin(t * 0.33) * 0.8;
            }
            px = lerp(px, tpx, 0.08); pz = lerp(pz, tpz, 0.08);
            depth = lerp(depth, 0.6, 0.04);
            const height = (x, z) =>
                0.18 * Math.sin(x * 1.1 + t * 0.35) * Math.cos(z * 0.9 - t * 0.25) +
                0.1 * Math.sin(x * 2.3 - z * 1.7 + t * 0.5) +
                -depth * Math.exp(-((x - px) ** 2 + (z - pz) ** 2) / 0.35);

            const path = new Path2D();
            const pts = [];
            for (let j = 0; j < ROWS; j++) {
                const z = 0.9 + (j / (ROWS - 1)) ** 1.35 * 9;
                const row = [];
                for (let i = 0; i < COLS; i++) {
                    const x = (i / (COLS - 1) - 0.5) * 2 * z * 1.05;
                    row.push(project(x, height(x, z), z));
                }
                pts.push(row);
            }
            pts.forEach(row => row.forEach(([x, y], i) => i ? path.lineTo(x, y) : path.moveTo(x, y)));
            for (let i = 0; i < COLS; i++) pts.forEach((row, j) => j ? path.lineTo(row[i][0], row[i][1]) : path.moveTo(row[i][0], row[i][1]));

            ctx.clearRect(0, 0, W, H);
            // iridescent colour that slides sideways over time
            const shift = (t * 0.04) % 1;
            const iris = ctx.createLinearGradient(-W * shift, 0, W * (2 - shift), 0);
            [...IRIS, ...IRIS, IRIS[0]].forEach((c, k, arr) => iris.addColorStop(k / (arr.length - 1), c));
            ctx.globalCompositeOperation = "lighter";
            ctx.strokeStyle = iris;
            ctx.globalAlpha = 0.12; ctx.lineWidth = 4; ctx.stroke(path);   // soft bloom
            ctx.globalAlpha = 0.85; ctx.lineWidth = 1; ctx.stroke(path);   // crisp line
            ctx.globalAlpha = 1;
            // a light that follows the dent
            const [dx, dy] = project(px, 0, pz);
            ctx.globalCompositeOperation = "source-atop";
            const rg = ctx.createRadialGradient(dx, dy, 0, dx, dy, W * 0.28);
            rg.addColorStop(0, "rgba(255,240,235,0.95)");
            rg.addColorStop(0.35, "rgba(234,179,163,0.55)");
            rg.addColorStop(1, "rgba(183,156,230,0)");
            ctx.fillStyle = rg;
            ctx.fillRect(0, 0, W, H);
            // fade into the distance
            ctx.globalCompositeOperation = "destination-in";
            const fade = ctx.createLinearGradient(0, horizon - 10, 0, H);
            fade.addColorStop(0, "rgba(0,0,0,0)");
            fade.addColorStop(0.25, "rgba(0,0,0,0.45)");
            fade.addColorStop(1, "rgba(0,0,0,1)");
            ctx.fillStyle = fade;
            ctx.fillRect(0, 0, W, H);
            // motes
            ctx.globalCompositeOperation = "lighter";
            motes.forEach(m => {
                const z = m.z, y = m.y + Math.sin(t * 0.6 + m.ph) * 0.12;
                const x = ((m.x + t * 0.05 + 3.5) % 7) - 3.5;
                const [sx, sy] = project(x, y, z);
                const a = (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.3 + m.ph))) * Math.min(1, 3 / z);
                const rad = Math.max(0.6, 2.6 / z * 1.6);
                ctx.globalAlpha = a * 0.25;
                ctx.fillStyle = m.c;
                ctx.beginPath(); ctx.arc(sx, sy, rad * 4, 0, 6.283); ctx.fill();
                ctx.globalAlpha = a;
                ctx.beginPath(); ctx.arc(sx, sy, rad, 0, 6.283); ctx.fill();
            });
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = "source-over";
        });
    }

    // ---------- Small 3D wireframes for the triptych ----------
    const wire = (ctx, W, H, fn, nu, nv, rx, ry, scale, colorFront, colorBack, closeU) => {
        const P = [];
        const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
        for (let i = 0; i <= nu; i++) {
            const row = [];
            for (let j = 0; j <= nv; j++) {
                let [x, y, z] = fn(i / nu, j / nv);
                [x, z] = [x * cy + z * sy, -x * sy + z * cy];
                [y, z] = [y * cx - z * sx, y * sx + z * cx];
                const p = 3.2 / (3.2 + z);
                row.push([W / 2 + x * scale * p, H / 2 + y * scale * p, z]);
            }
            P.push(row);
        }
        const front = new Path2D(), back = new Path2D();
        const seg = (a, b) => { const path = (a[2] + b[2]) / 2 > 0 ? back : front; path.moveTo(a[0], a[1]); path.lineTo(b[0], b[1]); };
        for (let i = 0; i <= nu; i++) for (let j = 0; j < nv; j++) seg(P[i][j], P[i][j + 1]);
        for (let j = 0; j <= nv; j++) for (let i = 0; i < nu; i++) seg(P[i][j], P[i + 1][j]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = colorBack; ctx.stroke(back);
        ctx.strokeStyle = colorFront; ctx.stroke(front);
    };

    document.querySelectorAll("[data-shape]").forEach(el => {
        const panel = el.closest(".panel") || el.parentElement;
        let hover = 0, hoverT = 0, tilt = 0, ttilt = 0;
        panel.addEventListener("pointerenter", () => { hoverT = 1; });
        panel.addEventListener("pointerleave", () => { hoverT = 0; ttilt = 0; });
        panel.addEventListener("pointermove", e => {
            const r = panel.getBoundingClientRect();
            ttilt = ((e.clientX - r.left) / r.width - 0.5) * 1.2;
        });
        const kind = el.dataset.shape;

        if (kind === "blob") {
            el.innerHTML = `
                <defs>
                    <radialGradient id="blobFill" cx="35%" cy="30%" r="75%">
                        <stop offset="0" stop-color="#fff1ea"/><stop offset=".35" stop-color="#eab3a3"/>
                        <stop offset=".75" stop-color="#e0523f"/><stop offset="1" stop-color="#5b1410"/>
                    </radialGradient>
                    <radialGradient id="blobFill2" cx="40%" cy="35%" r="70%">
                        <stop offset="0" stop-color="#e3ecff"/><stop offset=".5" stop-color="#6f93c8"/><stop offset="1" stop-color="#1b2b52"/>
                    </radialGradient>
                </defs>
                <path class="b2" fill="url(#blobFill2)" opacity=".85"/>
                <path class="b1" fill="url(#blobFill)"/>
                <ellipse cx="-22" cy="-30" rx="14" ry="7" fill="#fff" opacity=".55" transform="rotate(-30 -22 -30)"/>`;
            const b1 = el.querySelector(".b1"), b2 = el.querySelector(".b2");
            const blob = (t, R, k, ox, oy, seed) => {
                let d = "";
                const n = 64;
                for (let i = 0; i <= n; i++) {
                    const a = (i / n) * Math.PI * 2;
                    const r = R * (1 + k * (0.12 * Math.sin(3 * a + t * 0.9 + seed) + 0.08 * Math.sin(5 * a - t * 1.3 + seed * 2) + 0.05 * Math.cos(2 * a + t * 0.6)));
                    d += (i ? "L" : "M") + (ox + Math.cos(a) * r).toFixed(2) + " " + (oy + Math.sin(a) * r).toFixed(2);
                }
                return d + "Z";
            };
            loop(panel, t => {
                hover = lerp(hover, hoverT, 0.05);
                const k = 1 + hover * 1.6;
                b1.setAttribute("d", blob(t, 46, k, -8 + ttilt * 10, -4, 0));
                b2.setAttribute("d", blob(t * 0.8, 30, k, 34 + ttilt * 18, 30, 3));
            });
            return;
        }

        loop(panel, t => {
            const [ctx, W, H] = fitCanvas(el);
            ctx.clearRect(0, 0, W, H);
            hover = lerp(hover, hoverT, 0.05);
            tilt = lerp(tilt, ttilt, 0.06);
            const spin = t * (0.25 + hover * 0.5);
            const s = Math.min(W, H) * 0.36;
            if (kind === "manifold") {
                // a twisting sheet: the kind of curved surface representations live on
                const amp = 0.45 + hover * 0.25;
                wire(ctx, W, H, (u, v) => {
                    const x = (u - 0.5) * 2.4, z = (v - 0.5) * 2.4;
                    return [x, Math.sin(x * 1.6 + t * 0.8) * Math.cos(z * 1.4 - t * 0.6) * amp + (x * x - z * z) * 0.18, z];
                }, 22, 22, 0.9, spin + tilt, s * 0.62, "rgba(239,232,214,0.75)", "rgba(111,147,200,0.35)");
            } else if (kind === "cage") {
                // a glowing core, held inside a wire sphere
                const cx = W / 2, cy = H / 2, cr = s * 0.8 * (0.42 + 0.04 * Math.sin(t * 2) + hover * 0.08);
                const g = ctx.createRadialGradient(cx - cr * 0.3, cy - cr * 0.35, cr * 0.05, cx, cy, cr);
                g.addColorStop(0, "#ffd2c4"); g.addColorStop(0.45, "#e0523f"); g.addColorStop(1, "rgba(91,20,16,0)");
                wire(ctx, W, H, (u, v) => {
                    const th = u * Math.PI * 2, ph = v * Math.PI;
                    return [Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)];
                }, 18, 12, 0.35 + tilt * 0.3, spin, s * 0.8, "rgba(239,232,214,0)", "rgba(139,199,143,0.25)");
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill();
                wire(ctx, W, H, (u, v) => {
                    const th = u * Math.PI * 2, ph = v * Math.PI;
                    return [Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)];
                }, 18, 12, 0.35 + tilt * 0.3, spin, s * 0.8, "rgba(239,232,214,0.7)", "rgba(0,0,0,0)");
            }
        });
    });
})();

# Homepage text removed on 2026-10-27

Saved so it can be put back later. Each snippet is the original HTML from `index.html`.
(Folders starting with `_` are not published by GitHub Pages.)

## Hero: rotating "I'm interested in ..." word

Removed `"robots that behave"` from the list. Original:

```html
<span id="typed" data-words='["interpretability", "AI safety", "honesty & deception in models", "oil painting", "robots that behave"]'>interpretability</span>
```

## What I do: panel descriptions

Interpretability (went after `<h3>Interpret&shy;ability</h3>`):

```html
<p>Opening up neural networks to see how they actually work. Models store ideas on strange curved surfaces, and I'm especially fascinated by honesty and deception: can we tell when a model knows something it isn't saying?</p>
```

AI Safety (went after `<h3>AI <em>Safety</em></h3>`):

```html
<p>Building the guardrails so powerful AI stays something we can understand and trust. I help run AISST, and I'm endlessly curious about robots that act reliably in the real world.</p>
```

Painting (went after `<h3>Painting</h3>`):

```html
<p>Oil, mostly figures: hands, backs, faces in candlelight. It's where I go to look slowly, and it's the half of me that keeps the other half honest.</p>
<span class="go">See the paintings &rarr;</span>
```

## Who I am

Big statement (left column):

```html
<p class="about-statement" data-reveal>
    I look inside AI models to figure out what they're <em>really</em> thinking&mdash;and I paint people for the <span class="straw">exact same reason.</span>
</p>
```

Bio paragraphs (above the facts list):

```html
<p>Hi, I'm Anastasia (most people call me Stas)! I'm an AI safety researcher at Harvard SEAS, working on mechanistic interpretability&mdash;cracking neural networks open to understand how they work, and especially whether they're being honest with us.</p>
<p>Before this I spent several years in industry as a quant at Goldman, and somewhere in there I realized I was hungry for work that actually mattered to me, so I went back to school. Now I get to spend my days on the questions that kept me up at night anyway.</p>
<p>And when I'm not staring at activations, I'm usually staring at a canvas. Painting and interpretability turn out to be weirdly similar: you look at something long enough and carefully enough that it finally shows you what's underneath.</p>
```

Facts list rows:

```html
<li><span>Also</span><span>Board member, AISST</span></li>
<li><span>Medium</span><span>Oil on canvas</span></li>
```

The original layout was a two-column grid: `<div class="about-grid">` held the statement and `<div class="about-body" data-reveal style="--d: .12s">`.

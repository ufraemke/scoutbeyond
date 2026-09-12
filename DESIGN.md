# DESIGN.md

## 1. Design Direction

The interface should feel:

> Minimalist, precise, modern, calm, technical, and premium.

Reference qualities:

- Apple product interfaces,
- high-quality engineering software,
- modern scientific tools,
- contemporary editorial layouts.

Do not imitate Apple visually.

Use the underlying principles:

- strong hierarchy,
- restraint,
- whitespace,
- typography,
- clarity,
- subtle depth,
- deliberate interaction.

The product should feel credible to an engineer.

---

# 2. Overall Visual Character

Aim for:

- light interface,
- neutral background,
- dark typography,
- restrained accent color,
- generous whitespace,
- sharp information hierarchy,
- subtle borders,
- very limited shadows.

Avoid a stereotypical AI startup aesthetic.

Specifically avoid:

- purple-blue gradients,
- glowing elements,
- excessive rounded cards,
- animated blobs,
- glassmorphism,
- unnecessary AI icons,
- excessive emoji,
- large collections of colored badges.

---

# 3. Layout

Desktop-first.

Recommended page width:

```css
max-width: 1440px;
```

Main content width should often be narrower:

```css
max-width: 1200px;
```

Use generous horizontal margins.

Example:

```text
┌──────────────────────────────────────────────────────────────┐
│ Logo                                      Project / Settings │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│      Find technologies beyond your industry.                 │
│                                                              │
│      [ Describe your technical challenge...             ]    │
│                                                              │
│      [ Start research ]                                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

Do not fill every available area with UI.

Whitespace is part of the design.

---

# 4. Grid

Use a simple consistent grid.

Suggested:

- 12-column desktop grid,
- 24–32 px primary gap,
- 16 px internal gap,
- generous section spacing.

Main section spacing:

```text
64–96 px
```

Component spacing:

```text
8 / 12 / 16 / 24 / 32 px
```

Avoid arbitrary spacing values.

---

# 5. Typography

Use a clean system sans-serif.

Preferred:

```css
font-family:
  Inter,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

If Inter is not available, use the system stack.

## Hierarchy

### Display

For major page headings:

```text
48–64 px
weight 500–600
tight line height
```

### H1

```text
36–44 px
weight 500–600
```

### H2

```text
24–30 px
weight 500–600
```

### H3

```text
18–20 px
weight 600
```

### Body

```text
15–17 px
line-height 1.5–1.65
```

### Metadata

```text
12–14 px
```

Avoid excessive bold text.

Use font weight to establish hierarchy, not decoration.

---

# 6. Color

Keep the palette restrained.

## Base

Suggested starting values:

```css
--background: #F7F7F5;
--surface: #FFFFFF;

--text-primary: #161616;
--text-secondary: #626262;
--text-tertiary: #8A8A8A;

--border: #E5E5E2;
--border-strong: #D5D5D0;
```

## Primary accent

Use one cool technical accent.

Suggested:

```css
--accent: #176B87;
--accent-hover: #12566C;
--accent-soft: #EAF3F6;
```

The exact color may evolve.

Do not use the accent everywhere.

Its primary purposes are:

- interactive controls,
- important state,
- selected elements,
- meaningful visualization.

---

# 7. Result Categories

The three main technology categories need subtle visual distinction.

Do not turn them into three bright colored dashboards.

Suggested treatment:

### Established

Neutral / cool grey.

Meaning:

> proven and widely applied.

### Adjacent

Subtle blue / teal.

Meaning:

> proven in another application or industry.

### Exploratory

Subtle warm neutral or muted violet.

Meaning:

> emerging, less proven, or unconventional.

Color should assist orientation.

Labels must remain understandable without color.

---

# 8. Navigation

Keep navigation minimal.

Example:

```text
Technology Scanner                      New scan     History
```

During the hackathon, avoid building navigation that the prototype does not need.

A single top navigation bar is sufficient.

Suggested height:

```text
56–64 px
```

Use a subtle bottom border.

Avoid oversized app headers.

---

# 9. Input Screen

The first screen should feel extremely simple.

Primary hierarchy:

```text
Technology Scanner

Find technologies beyond your industry.

Describe your technical challenge.

┌───────────────────────────────────────────┐
│ We currently clean the interior of...    │
│                                           │
│                                           │
└───────────────────────────────────────────┘

                    Start research →
```

Optional context fields should remain secondary.

Do not show a large configuration form upfront.

---

# 10. Buttons

Primary button:

- solid accent color,
- white text,
- medium weight,
- subtle radius.

Suggested:

```css
height: 44px;
padding: 0 18px;
border-radius: 8px;
```

Secondary button:

- white / transparent background,
- subtle border,
- dark text.

Avoid:

- giant pill buttons,
- excessive icon buttons,
- multiple competing primary buttons.

---

# 11. Border Radius

Use moderate radius.

Suggested:

```text
6–10 px
```

Large containers:

```text
10–14 px
```

Avoid making every component a rounded pill.

---

# 12. Shadows

Use shadows sparingly.

Prefer borders and surface contrast.

If needed:

```css
box-shadow:
  0 1px 2px rgba(0,0,0,0.04),
  0 4px 16px rgba(0,0,0,0.04);
```

No dramatic floating-card effects.

---

# 13. Research Progress

The research state should communicate that the system is doing structured work.

Avoid fake terminal output.

Prefer something like:

```text
Researching technical approaches

✓ Understanding the challenge
✓ Searching established technologies
● Exploring adjacent industries
○ Checking emerging approaches
○ Comparing evidence
```

A subtle animated progress indicator is sufficient.

Possible supporting text:

```text
Exploring applications outside conventional tank-cleaning systems…
```

Keep this concise.

---

# 14. Result Landscape

The central results screen should visually emphasize the three-category technology landscape.

Recommended desktop structure:

```text
Technology landscape
12 candidate approaches identified

┌───────────────────┬───────────────────┬───────────────────┐
│ ESTABLISHED       │ ADJACENT          │ EXPLORATORY       │
│                   │                   │                   │
│ Rotary jet        │ Ultrasonic        │ Plasma treatment  │
│ cleaner           │ cleaning          │                   │
│                   │                   │                   │
│ Pigging           │ Ice blasting      │ Robotic crawling  │
│                   │                   │                   │
│ ...               │ ...               │ ...               │
└───────────────────┴───────────────────┴───────────────────┘
```

Columns should feel like one landscape, not three unrelated panels.

Use vertical separators rather than heavy card boundaries where possible.

---

# 15. Candidate Presentation

Candidate items should be compact.

Example:

```text
Ultrasonic cleaning                          78

Uses high-frequency acoustic energy to
remove deposits without mechanical spray.

Why relevant
Potential reduction in water consumption.

Maturity
Commercial in adjacent cleaning applications.

2 sources
```

Initial list cards should not display every available field.

The user should be able to open a detailed view.

---

# 16. Candidate Detail View

Detail hierarchy:

```text
Ultrasonic cleaning

Adjacent technology
Overall fit 78 / 100

Why it may work
...

Potential advantages
...

Limitations
...

Technical maturity
...

Sustainability implications
...

Evidence

01  Research paper...
02  Supplier application...
03  Industry article...
```

Sources should look like evidence, not footnotes hidden at the bottom.

---

# 17. Scoring

Scores should support decisions, not dominate the interface.

Avoid giant circular gauges.

Preferred representations:

```text
Overall fit        78 / 100

Cleaning impact    ████████░░
Retrofitability    ██████░░░░
Maturity           █████████░
Sustainability     ███████░░░
```

Or use simple numerical values.

The score should always be explainable.

---

# 18. Sources

Sources are a core part of the product.

Each source should clearly display:

- title,
- publisher / organization if known,
- type if useful,
- link.

Example:

```text
01
Ultrasonic cleaning of industrial surfaces
Fraunhofer Institute · Research
↗ Open source
```

Source links must look interactive.

---

# 19. Assumptions and Uncertainty

Do not hide assumptions.

Use subtle inline components.

Example:

```text
Assumption

Tank material is stainless steel and the system
must remain cleanable in place.
```

Allow correction where practical.

Uncertainty could be expressed as:

```text
Evidence strength
High / Medium / Low
```

Avoid pretending AI confidence percentages are scientifically meaningful.

---

# 20. Icons

Use icons only when they improve comprehension.

Preferred:

- simple line icons,
- one consistent icon library,
- 16–20 px size.

Examples:

- external link,
- source,
- filter,
- expand,
- check,
- warning.

Do not add icons to every label.

---

# 21. Animation

Animation should be functional.

Good uses:

- research progress,
- subtle loading,
- panel transitions,
- hover feedback,
- opening candidate detail.

Typical duration:

```text
150–250 ms
```

Avoid:

- decorative entrance animations,
- bouncing elements,
- excessive stagger effects,
- continuous motion.

---

# 22. Hover and Interaction

Interactive elements should respond clearly but subtly.

Examples:

```text
border darkens
background changes slightly
arrow moves 2 px
```

No dramatic scaling.

---

# 23. Empty States

Empty states should be direct.

Example:

```text
No technologies found yet.

Adjust the challenge description or remove
one of the constraints and run the scan again.
```

Avoid cute illustrations unless they materially help.

---

# 24. Error States

Errors should be calm and specific.

Example:

```text
Research could not be completed.

The source search service did not respond.
Your challenge description has been preserved.

Try again
```

Do not display raw API errors to users.

---

# 25. Responsive Behavior

Desktop is the priority.

The interface should still remain usable on tablet.

For the three-column landscape:

Desktop:

```text
Established | Adjacent | Exploratory
```

Narrow screens:

```text
Established
───────────

Adjacent
───────────

Exploratory
```

Do not sacrifice desktop clarity for elaborate mobile behavior during the hackathon.

---

# 26. Accessibility

Maintain strong contrast.

Use semantic elements.

Ensure visible focus states.

Do not communicate:

- category,
- status,
- score,
- risk

using color alone.

---

# 27. Desired Impression

The interface should communicate:

> serious technical research made dramatically easier.

Not:

> AI magic.

Not:

> enterprise dashboard.

Not:

> futuristic chatbot.

The product should feel credible enough that an experienced engineer would be comfortable using it as part of a real technology search.
## Plan Review: Phase 5 & 6

### What's changed since the plan was written

| Addition | Impact on remaining phases |
|----------|--------------------------|
| Phase 4.7 spatial transitions | Phase 6 golden test now has more tools to exercise |
| Director cinematography prompt | P6-09 (AI vs manual) is now a real comparison, not a formality |
| Parser image-count cap | P6-02 (22 images → ~22 beats) will work cleanly |
| Schema 1.1.0 | P5-10 (persistence) needs migration awareness for saved 1.0.0 projects |

### Recommended execution order
Phase 5a — Persistence (do FIRST)
P5-10 Project save/load (IndexedDB)
P5-11 Recent projects list

Phase 6a — Golden Test WITHOUT audio (do SECOND)
P6-01 Load 22 prologue artworks
P6-02 Map beats (use Director + manual refinement)
P6-03 Apply effects — verify spatial transitions work at scale
P6-04 Text overlays (Arabic + English)
P6-05 Transitions — verify composite transitions look right
P6-07 Full preview review (no audio yet)
P6-08 Export WebM (silent)
P6-09 Director comparison: AI vs manual
P6-10 Document results — bug list becomes P5 priority input

Phase 5b — Audio + Polish (informed by golden test bugs)
P5-01 Audio file slot
P5-02 Audio playback sync
P5-03 Audio in export
P5-04 Export resolution selector
P5-09 Toast notifications (if bugs showed user confusion)

Phase 6b — Golden Test FINAL
P6-06 Add ambient audio track
P6-07 Full review WITH audio
P6-08 Final export at 1080p

text

### Tasks I'd deprioritize or cut

| Task | Verdict | Reason |
|------|---------|--------|
| P5-05 Export time estimate | **Defer to v1.5** | Nice UX but not blocking. Export already shows progress %. |
| P5-06 Export file size estimate | **Defer to v1.5** | Requires bitrate modeling — effort vs value is poor |
| P5-07 Plate preview thumbnails | **Defer** | Thumbnails already show the source image. Effect preview on thumbnail is cosmetic. |
| P5-08 Effect preview on hover | **Cut** | High effort (animated preview in dropdown), minimal impact. Users preview in the canvas. |

### New tasks to add (from this session)

| Task | Phase | Description |
|------|-------|-------------|
| P5-12 | 5a | Schema migration — if saved project is 1.0.0, auto-upgrade to 1.1.0 on load |
| P5-13 | 5b | Export resolution actually working — verify offscreen canvas resizes for 720p/1080p/4K and buffers A/B resize with it |
| P7-01 | Future | Parallax depth layers (fake: zoom + offset + blur duplicate) |
| P7-02 | Future | Video generation adapter interface (Runway/Kling/SVD) |
| P7-03 | Future | Soft-edge wipes (feathered wipe transitions using gradient masks) |

### Updated roadmap
Phase 5a — Persistence ~1 day
Phase 6a — Golden Test (silent) ~2 days ← this is where real bugs surface
Phase 5b — Audio + Polish ~2 days ← informed by golden test findings
Phase 6b — Golden Test (final) ~1 day

text

**Total remaining: ~6 days.**
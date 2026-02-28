# 🎬 MotionPlate Director Pack: "Prologue" Demo

Take this entire document to your agent
It contains all the context needed to generate a perfect, schema-valid `sequence.json` for the Doxascope "Prologue" experience.

---

## 1. YOUR ROLE
You are **MotionPlate Director**, a master AI cinematographer. Your goal is to translate prose into a high-fidelity visual sequence.

## 2. THE SCRIPT (Prologue.md)
```markdown
In the beginning, there was no beginning.
There was potential. A density without dimension. A pressure without space to press against. Something coiled in the fabric of what would become existence...
[Full text provided in the system prompt context - use the 22 beats provided below]
```

## 3. AVAILABLE IMAGES (section-1-physics)
You have exactly 22 images available. You must assign each beat to one of these files in order:
1. `s1_1_void_001.png`
2. `s1_1_density_002.png`
3. `s1_1_coiled_003.png`
4. `s1_2_rupture_001.png`
5. `s1_2_particles_002.png`
6. `s1_2_electron_003.png`
7. `s1_3_approaching_001.png`
8. `s1_3_binding_002.png`
9. `s1_3_hydrogen_003.png`
10. `s1_4_gascloud_001.png`
11. `s1_4_ignition_002.png`
12. `s1_4_supernova_003.png`
13. `s1_4_elements_004.png`
14. `s1_5_earth_001.png`
15. `s1_5_cell_002.png`
16. `s1_5_evolution_003.png`
17. `s1_5_eye_004.png`
18. `s1_6_stargazer_001.png`
19. `s1_6_questions_002.png`
20. `s1_6_mist-edge_003.png`
21. `s1_6_fullmist_004.png`
22. `logo.png` (End slate)

## 4. CINEMATOGRAPHY RULES
### Effects
- **kenBurns**: Pan (panX/panY) + Zoom (startScale/endScale). Use for 70% of plates.
  - Zoom IN (1.0 -> 1.2) for emotional focus.
  - Zoom OUT (1.2 -> 1.0) for reveals.
  - Pan POSITIVE for forward motion; NEGATIVE for retreat/history.
- **pulse**: frequency 1-2, amplitude 0.02. Use for cellular/organic beats.
- **drift**: Sinusoidal float. Best for floating particles/cosmic void.
- **rotate**: maxAngle 1-3. Use for disorientation or cosmic scale.

### Post-Effects
- **vignette**: intensity 0.4-0.6. Use on almost every plate.
- **bloom**: intensity 0.2. Use for starlight/ignition/divinity.
- **particles**: count 40-80. Use for space/void/atmospheric beats.
- **fog**: intensity 0.15. Use for mystery/Mist beats.

### Transitions
- **crossfade**: Default (1.0s). Use for thematic continuity.
- **wipeLeft / wipeDown**: Use for physical scene changes (1.0s).
- **slideLeft**: Use for temporal progression (1.2s).
- **zoomThrough**: USE EXACTLY ONCE at the most climactic moment (1.5s).
- **fadeThroughBlack**: Use for chapter endings (2.0s).

## 5. OUTPUT FORMAT (JSON)
You must output ONLY a JSON object that strictly adheres to the schema.
- **Schema Version**: `1.1.0`
- **Text Overlays**: Maximum 12 words. Use exact quotes from the script.
- **Durations**: Vary between 3.0 and 8.0 seconds.

---

### REQUIRED JSON SCHEMA (FOR VALIDATION)
```json
{
  "meta": { "title": "Prologue", "fps": 30, "width": 1920, "height": 1080, "schemaVersion": "1.1.0" },
  "plates": [
    {
      "id": "plate_1",
      "duration": 6.0,
      "effect": "kenBurns",
      "effectConfig": { "startScale": 1.0, "endScale": 1.1, "panX": 0.02, "anchor": "center" },
      "post": ["vignette", "particles"],
      "postConfig": { "vignette": { "intensity": 0.6 }, "particles": { "count": 60 } },
      "transition": "fadeThroughBlack",
      "transitionDuration": 2.0,
      "text": "In the beginning, there was no beginning.",
      "textConfig": { "fontSize": 32, "position": "bottom", "fadeIn": 0.2, "fadeOut": 0.2, "shadow": true }
    }
    // ... continue for all 22 images
  ]
}
```

## 6. INSTRUCTIONS
Generate the full `sequence.json` now for all 22 plates, ensuring the image filenames in your internal mapping correspond to the plate indices 1–22.

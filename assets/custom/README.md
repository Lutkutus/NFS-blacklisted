# BLACKLINE custom parts

User-supplied realistic-jdm-rim-pack.zip and ultimate-car-spoiler-pack-game-ready.zip. Original source copies are in ../custom-source; user Downloads archives are unchanged. Original asset rights remain with their creators.

Build: node tools/build-custom-parts.mjs, then python tools/pack-custom-textures.py (Pillow required). Four wheel meshes are axis-aligned in local coordinates, normalized to radius one and depth 0.36, voxel simplified and quantized. UVs and base color maps are retained at reduced resolution. Normal, metallic and roughness maps are omitted for the Lambert PSX renderer.

The spoiler GLB contains ten blades and nine mount assemblies. Nearby blade/mount pairs are combined in the same source coordinate frame, centered across the car and normalized by width. Source orientation is preserved. import-audit.json records the combined names and triangle counts.

Runtime scales wheels to each source car's radius and tire width. Spoiler, splitter and skirt fitting is automatic; integral original spoilers remain visible.

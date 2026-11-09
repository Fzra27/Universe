# Catalog attribution and licenses

## HYG stars

`public/data/stars.json` is an extract and transformation of HYG v4.1 by David Nash / Astronomy Nexus and the HYG Database contributors.

Source: https://github.com/astronexus/HYG-Database/blob/main/hyg/CURRENT/hygdata_v41.csv

Source repository and attribution: https://github.com/astronexus/HYG-Database

License: **Creative Commons Attribution-ShareAlike 4.0 International**, https://creativecommons.org/licenses/by-sa/4.0/ ; legal text: https://creativecommons.org/licenses/by-sa/4.0/legalcode

Changes: removed objects lacking usable measured distances, selected identifying and coordinate/spectral columns, converted RA hours to degrees and parsecs to light-years, rounded values, and serialized compact JSON arrays. This transformed dataset is distributed under the same CC BY-SA 4.0 license. Attribution is also available in the application's handbook and README. No endorsement is implied.

## NASA Exoplanet Archive

`public/data/exoplanets.json` is a filtered extract from NASA Exoplanet Archive `pscomppars` (Composite Planet Data).

This application makes use of the NASA Exoplanet Archive, which is operated by the California Institute of Technology, under contract with the National Aeronautics and Space Administration under the Exoplanet Exploration Program.

Source: https://exoplanetarchive.ipac.caltech.edu/

Acknowledgement and citation guidance: https://exoplanetarchive.ipac.caltech.edu/docs/acknowledge.html

Changes: omitted records without positive distances or sky coordinates, converted parsecs to light-years, and serialized selected fields into compact arrays. Original measurements come from the underlying scientific publications indexed by the Archive. Consult the Archive for measurement provenance and uncertainty.

## Curated objects

Solar System values derive from NASA NSSDC Planetary Fact Sheets. Black-hole and galaxy landmarks are a small rounded reference selection with source links in `src/catalog.ts`. No mission logos are redistributed. Except for the Earth texture described below, rendered planetary surfaces, accretion disks, star backdrops, and galaxy particles are procedural illustrations.

## Earth surface texture

`public/textures/earth-daymap.jpg`: **Solar System Scope**, Earth daymap (2K), https://www.solarsystemscope.com/textures/ . Direct source: https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg

Licensed under **Creative Commons Attribution 4.0 International**, https://creativecommons.org/licenses/by/4.0/ . File redistributed without modification; the renderer adds lighting and illustrative cloud effects. No endorsement is implied.

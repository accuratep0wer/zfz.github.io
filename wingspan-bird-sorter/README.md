# Wingspan Bird Atlas / 展翅翱翔双语鸟牌图鉴

A mobile-first Chinese / English static web app for browsing, searching, filtering and sorting Wingspan bird cards.

## Features

- Mobile-first responsive card gallery
- 中文 / English UI toggle
- Bilingual bird naming: Chinese override + English common name + scientific name
- Real bird illustrations from the **Wingsearch image asset pack** instead of silhouette placeholders
- Search by Chinese name, English common name, scientific name, power text, and power category
- Filter by expansion, habitat, power color, nest type, and point range
- Sort by points, name, egg limit, wingspan, food cost, or expansion
- Tap a bird to open a larger illustrated detail view
- Compact list view for phones
- Plain HTML/CSS/JavaScript; no build step
- GitHub Pages ready

## Data source

Bird-card statistics are loaded at runtime from Wingsearch:

`https://raw.githubusercontent.com/navarog/wingsearch/master/src/assets/data/master.json`

The image URL pattern used by this project is:

`https://raw.githubusercontent.com/navarog/wingsearch/master/src/assets/cards/birds-diffusion/{id}.webp`

If that image is unavailable, the app falls back to:

`https://raw.githubusercontent.com/navarog/wingsearch/master/src/assets/cards/birds/{id}.webp`

### Important artwork note

The images shown by this project are **Wingsearch project assets / fan-art image packs**. They are not represented here as the official artwork printed on the physical Wingspan cards. Wingspan and its official artwork remain the property of their respective rights holders.

Wingsearch is licensed GPLv3. If you redistribute a derivative that incorporates Wingsearch code/assets, review and comply with the GPLv3 license and the upstream project's notices.

## Chinese bird names

Wingsearch does not currently include a Simplified Chinese translation file. `zh-names.js` provides a Chinese common-name override dictionary. Cards without a Chinese mapping still work and display the English name; you can progressively fill the dictionary without changing application logic.

## Credits

- Wingspan: designed by Elizabeth Hargrave, published by Stonemaier Games.
- Card data and bird-image assets: Wingsearch by navarog and contributors.
- This project is an unofficial fan reference and is not affiliated with or endorsed by Stonemaier Games.

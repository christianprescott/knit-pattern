# Knitpicker

A static web app for designing knitting patterns and choosing yarn colors.

### TODO

- [ ] Click cell to activate color picker
- [ ] Performance improvement. Debounce color preview. Optimize cell rendering.
- [ ] Validate color key input. Sanitize single characters for class name and URL encode. Considering the current `Array.from` approach it may even necessitate a whitelist to avoid handling unexpected graphemes like 🏳️‍🌈.
- [ ] Change layout orientation either responsive to window width or fit to pattern aspect ratio.
- [ ] Header, footer, about page with attributions, privacy policy page
- [ ] Pattern recognition via image upload or camera capture. See branch `image` for a POC uing OpenCV.
- [ ] Render cells as rectangle/dot/other. If only for faster rendering performance.

## Development

Open index.html in a browser. Make changes to app.js and reload the page.

It's not necessary to install dependencies to load the page and run the app.

```sh
# lint
npm run format
```

## Test

```sh
npm install
npm test
# or if you're container-inclined:
docker run --rm -t -v "$(pwd):/app" -w /app node:18 npm test
```

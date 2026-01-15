# Knitpicker

A static web app for designing knitting patterns and choosing yarn colors.

### TODO

- [ ] Validate color key input. Sanitize single characters for class name and URL encode. Considering the current `Array.from` approach it may even necessitate a whitelist to avoid handling unexpected graphemes like 🏳️‍🌈.
- [ ] Determine maximum size of URL param. Warn when input exceeds this size.
- [ ] Help section for instruction on creating and editing patterns
- [ ] Change layout orientation either responsive to window width or fit to pattern aspect ratio.
- [ ] Header, footer, about, license, terms
- [ ] Pattern recognition via image upload or camera capture. See branch `image` for a POC uing OpenCV.
- [ ] Replace native color input with a color picker component. Consider https://iro.js.org/
- [ ] Render cells as rectangle/dot/other. If only for faster rendering performance.

## Development

Open index.html in a browser. Make changes to app.js and reload the page.

It's not necessary to install dependencies to load the page and run the app.

```sh
# lint
docker run --rm -t -v "$(pwd):/app" -w /app node:18 npm run format
```

## Test

```sh
npm install
npm test
# or if you're container-inclined:
docker run --rm -t -v "$(pwd):/app" -w /app node:18 npm test
```

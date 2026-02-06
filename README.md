# Knitpicker

A static web app for designing knitting patterns and choosing yarn colors.

### TODO

- [ ] Repeat/zoom canvas gets stretched on webkit
- [ ] Validate color key input. Sanitize single characters for class name and URL encode. Considering the current `Array.from` approach it may even necessitate a whitelist to avoid handling unexpected graphemes like 🏳️‍🌈.
- [ ] Change layout orientation either responsive to window width or fit to pattern aspect ratio.
- [ ] Header, footer, about page with attributions, privacy policy page
- [ ] Pattern recognition via image upload or camera capture. See branch `image` for a POC uing OpenCV.
- [ ] Render cells as rectangle/dot/stitch/other. If only for faster rendering performance.
- [ ] Resize canvas image before uploading to Claude per https://platform.claude.com/docs/en/build-with-claude/vision

## Development

Open index.html in a browser. Make changes to app.js and reload the page.

The app is designed to run without a compilation step or web server so it's not necessary to install dependencies to load the page and run the app.

### Web Server

Optionally, run the web server. Additional features will be made available when the app detects the server is present.

```sh
docker build -t knit-pattern .
docker run --rm -p 8080:8080 -e RELOAD=1 -e LOG_LEVEL=DEBUG -e ANTHROPIC_API_KEY='your-api-key' -v "${PWD}:/app"  knit-pattern
```

### Lint

```sh
npm run format
```

## Test

```sh
npm install
npm test
# or if you're container-inclined:
docker run --rm -t -v "$(pwd):/app" -w /app node:18 npm test
```

## Deployment

The app is deployed to fly.io. The [fly-deploy.yml](.github/workflows/fly-deploy.yml) GH Action deploys with each push to master. Use `fly tokens create deploy --expiry 8760h` to regenerate the FLY_API_TOKEN secret used for the Action.

Or deploy from CLI:

```sh
flyctl deploy
```

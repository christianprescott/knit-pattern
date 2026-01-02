# Knitpicker

A static web app for designing knitting patterns and choosing yarn colors.

## Development

Open index.html in a browser. Make changes to app.js and reload the page.

It's not necessary to install dependencies to load the page and run the app.

## Test

```sh
npm install
npm test
# or if you're container-inclined:
docker run --rm -t -v "$(pwd):/app" -w /app node:18 npm test
```

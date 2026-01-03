encodeGzip = async (input) => {
  const inStream = new Blob([input]).stream()
  const stream = inStream.pipeThrough(new CompressionStream('gzip'))
  const compressed = await new Response(stream).arrayBuffer()
  const bytes = new Uint8Array(compressed)
  return btoa(String.fromCharCode(...bytes))
}

decodeGzip = async (encoded) => {
  const binary = atob(encoded)
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
  const outStream = new Blob([bytes]).stream()
  const stream = outStream.pipeThrough(new DecompressionStream('gzip'))
  return await new Response(stream).text()
}

parseStitches = (input) => {
  // Parse grid
  const rows = input.split("\n").map((row) => {
    return row.split(/[,]/)
      .map((s) => Array.from(s))
      .flat()
      .map((s) => s.trim())
      .filter((word) => word.length > 0)
  }).filter((row) => row.length > 0)
  return rows
}

const updateUrlParams = (updates) => {
  const params = new URLSearchParams(window.location.search)
  for (const [key, value] of Object.entries(updates)) {
    params.set(key, value)
  }
  const baseUrl = window.location.href.split('?')[0]
  const newUrl = baseUrl + '?' + params.toString()
  history.replaceState(null, '', newUrl)
}

const { createElement, useState } = React

function Icon(name) {
  return createElement('span', { className: 'material-symbols-outlined' },
    name
  )
}

function ShareButton() {
  const handleShare = () => {
    const url = window.location.href

    return navigator.share({
      title: 'Knitpicker Pattern',
      text: 'Check out this knit pattern!',
      url: url
    }).catch(err => {
      // User cancelled the share or there was an error
      if (err.name !== 'AbortError') {
        console.error('Error sharing:', err)
        return handleCopy(url)
      }
    })
  }

  const handleCopy = () => {
    const url = window.location.href
    return navigator.clipboard.writeText(url).catch(err => {
      console.error('Failed to copy:', err)
    })
  }

  const className = 'mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center gap-2'
  // Check if Web Share API is available (mobile devices)
  if (navigator.share) {
    return createElement('button', { className, onClick: handleShare },
      Icon('share'),
      'Share Pattern'
    )
  } else {
    return createElement('button', { className, onClick: handleCopy },
      Icon('content_copy'),
      'Copy Pattern Link'
    )
  }
}

function App({ defaultInput, defaultCustomColors }) {
  const [stitches, setStitches] = useState(parseStitches(defaultInput))
  const [customColors, setCustomColors] = useState(defaultCustomColors)
  const [zoom, setZoom] = useState(6)

  const onInputChanged = (v) => {
    const input = v.target.value
    setStitches(parseStitches(input))
    encodeGzip(input).then((encoded) => {
      updateUrlParams({ stitches: encoded })
    })
  }

  const onColorChanged = (colorKey, color) => {
    updateUrlParams({ [`color_${colorKey}`]: color })
    setCustomColors({
      ...customColors,
      [`--color-${colorKey}`]: color
    })
  }

  // Max row length
  const maxLength = Math.max(...stitches.map((r) => r.length))

  // Select default colors
  const colors = [...new Set(stitches.flat())].sort()
  const colorMap = Object.fromEntries(colors.map((colorKey, i) => {
    const color = Math.floor((i / colors.length) * 8 + 4).toString(16);
    return [`--color-${colorKey}`, `#${color}${color}${color}`]
  }))

  const stitchClasses = 'aspect-square border border-zinc-300'
  const stitchCells = stitches.map((row, i) => {
    const cells = row.map((column, j) => {
      return createElement('div', {
        key: i + '_' + j,
        className: stitchClasses,
        style: { backgroundColor: `var(--color-${column})`}
      })
    })
    // Add additional cells to match length of longest row
    for (let j = cells.length; j < maxLength; j++) {
      cells.push(createElement('div', {
        key: i + '_' + (cells.length + j),
        className: stitchClasses
      }))
    }
    return cells
  })

  const colorInputs = colors.map((colorKey) => {
    const cssVarName = `--color-${colorKey}`
    const currentColor = customColors[cssVarName] || colorMap[cssVarName]

    return createElement('div', { key: colorKey, className: 'flex items-center' },
      createElement('input', {
        id: `color_${colorKey}`,
        type: 'color',
        value: currentColor,
        onChange: (e) => onColorChanged(colorKey, e.target.value)
      }),
      createElement('label', { for: `color_${colorKey}`}, colorKey),
    )
  })

  return createElement('div', {},
    createElement('div', { className: 'flex' },
      createElement('div', { className: 'flex-1 p-4' },
        createElement('h2', { className: 'text-2xl' },
          Icon('edit'),
          'Pattern'
        ),
        createElement('textarea', {
          className: 'font-mono w-full min-h-48',
          defaultValue: defaultInput,
          onChange: onInputChanged
        }),
      ),
      createElement('div', { className: 'flex-1 p-4 flex flex-col' },
        createElement('h2', { className: 'text-2xl' },
          Icon('palette'),
          'Colors'
        ),
        colorInputs,
        createElement('div', { className: 'mt-auto self-end' },
          ShareButton(),
          createElement('div', { className: 'mt-4 flex items-center gap-2' },
            Icon('zoom_in'),
            createElement('input', {
              type: 'range',
              min: '1',
              max: '6',
              step: '1',
              value: zoom,
              onChange: (e) => setZoom(parseInt(e.target.value)),
              className: 'w-32'
            })
          )
        ),
      ),
    ),
    createElement('div', {
        className: `transition-[width] w-${zoom}/6 grid gap-0 bg-zinc-400`,
        style: {
          ...colorMap,
          ...customColors,
          gridTemplateColumns: `repeat(${maxLength}, 1fr)`,
        }
      },
      stitchCells
    ),
  )
}

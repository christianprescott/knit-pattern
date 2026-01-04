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

const { createElement, useState, useRef, useEffect } = React

function Icon(name) {
  return createElement('span', { className: 'material-symbols-outlined' },
    name
  )
}

function Cell({ colorKey, ...props }) {
  return createElement('div', {
      className: 'min-h-0 overflow-visible aspect-4/3',
      ...props,
    },
    colorKey && createElement('svg', {
      viewBox: '0 0 24 24',
      className: 'w-full stroke-1 stroke-zinc-300',
      style: { fill: `var(--color-${colorKey})` }
    },
      createElement('use', { href: '#stitch' })
    )
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
  const colorInputsRef = useRef(null)

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
      [colorKey]: color
    })
  }

  // Select default colors
  const colors = [...new Set(stitches.flat())].sort()
  const defaultColors = Object.fromEntries(colors.map((colorKey, i) => {
    const color = Math.floor((i / colors.length) * 128 + 64).toString(16).padStart(2, '0')
    return [colorKey, `#${color}${color}${color}`]
  }))

  // Initialize Sortable.js for drag-and-drop color swapping
  useEffect(() => {
    if (colorInputsRef.current) {
      let swapItem
      const instance = Sortable.create(colorInputsRef.current, {
        draggable: '.color-input-item',
        handle: '.drag-handle',
        animation: 150,
        ghostClass: 'opacity-40',
        swap: true,
        swapClass: 'opacity-40',
        onMove: (evt) => {
          // Sortable.js wants to swap the draggable elements themselves after
          // drop which doesn't work with React's DOM reconciliation.
          // Manually track the drop target so we can cancel the event in the
          // onMove function.
          swapItem = evt.related
          return false
        },
        onStart: (evt) => {
          swapItem = null
        },
        onEnd: (evt) => {
          const { item } = evt
          // This event still fires when drag is dropped on itself, but no
          // swap is necessary.
          if (!swapItem || (item === swapItem)) return

          // Get color keys from the items
          const colorKeyFrom = item.getAttribute('data-color-key')
          const colorKeyTo = swapItem.getAttribute('data-color-key')

          setCustomColors((prev) => {
            const colorFrom = prev[colorKeyFrom] || defaultColors[colorKeyFrom]
            const colorTo = prev[colorKeyTo] || defaultColors[colorKeyTo]

            // Update URL params
            updateUrlParams({
              [`color_${colorKeyFrom}`]: colorTo,
              [`color_${colorKeyTo}`]: colorFrom
            })

            // Swap the colors
            return {
              ...prev,
              [colorKeyFrom]: colorTo,
              [colorKeyTo]: colorFrom
            }
          })
        }
      })

      // Tear down the Sortable instance before creating a new one
      return () => instance.destroy()
    }
  }, [colors.join(',')])

  // Max row length
  const maxLength = Math.max(...stitches.map((r) => r.length))

  const stitchCells = stitches.map((row, i) => {
    const cells = row.map((column, j) => {
      return Cell({ key: i + '_' + j, colorKey: column })
    })
    // Add additional cells to match length of longest row
    for (let j = cells.length; j < maxLength; j++) {
      cells.push(Cell({ key: i + '_' + (cells.length + j) }))
    }
    return cells
  })
  // Add a row of empty cells as background for the last row's overflow
  for (let j = 0; j < maxLength; j++) {
    stitchCells.push(Cell({ className: 'aspect-4/1' }))
  }

  const colorRows = colors.flatMap((colorKey) => {
    const currentColor = customColors[colorKey] || defaultColors[colorKey]

    return [
      createElement('label', {
        key: `label-${colorKey}`,
        for: `color_${colorKey}`,
        className: 'flex items-center'
      }, colorKey),
      createElement('div', {
        key: `input-${colorKey}`,
        className: 'color-input-item flex items-center gap-2 p-1',
        'data-color-key': colorKey
      },
        createElement('input', {
          id: `color_${colorKey}`,
          type: 'color',
          value: currentColor,
          onChange: (e) => onColorChanged(colorKey, e.target.value)
        }),
        createElement('div', {
            className: 'flex items-center drag-handle cursor-grab active:cursor-grabbing select-none text-lg'
          },
          Icon('drag_indicator')
        ),
      )
    ]
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
        createElement('div', {
          ref: colorInputsRef,
          className: 'grid gap-x-2 gap-y-1',
          style: { gridTemplateColumns: 'auto 1fr' }
        },
          colorRows
        ),
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
        className: `transition-[width] w-${zoom}/6 grid gap-0 bg-zinc-300`,
        style: {
          ...Object.fromEntries(
            Object.entries({ ...defaultColors, ...customColors })
            .map(([k, v]) => [`--color-${k}`, v]),
          ),
          gridTemplateColumns: `repeat(${maxLength}, 1fr)`,
        }
      },
      stitchCells
    ),
  )
}

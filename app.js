encodeGzip = async (input) => {
  const inStream = new Blob([input]).stream()
  const stream = inStream.pipeThrough(new CompressionStream('gzip'))
  const compressed = await new Response(stream).arrayBuffer()
  const bytes = new Uint8Array(compressed)
  return btoa(String.fromCharCode(...bytes))
}

decodeGzip = async (encoded) => {
  const binary = atob(encoded)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  const outStream = new Blob([bytes]).stream()
  const stream = outStream.pipeThrough(new DecompressionStream('gzip'))
  return await new Response(stream).text()
}

decodeOrDefault = async (input) => {
  if (input) {
    return decodeGzip(input).catch(() => {
      const countByChar = Array.from(input).reduce(
        (acc, c) => ((acc[c] = (acc[c] || 0) + 1), acc),
        {},
      )
      const totalChars = Object.values(countByChar).reduce((a, b) => a + b, 0)
      const maxFrequency = Math.max(...Object.values(countByChar)) / totalChars
      console.log(maxFrequency)

      if (Object.keys(countByChar).length > 12 && maxFrequency < 0.1) {
        // The input appears to be a malformed gzip encoding
        return ''
      } else {
        // The input appears to be a literal pattern
        return input
      }
    })
  } else {
    return 'A A A B A A A B\nA A B A A A B A\nA B A A A B A A\nB A A A B A A A\n'
  }
}

parseStitches = (input) => {
  // Parse grid
  const rows = input
    .split('\n')
    .map((row) => {
      return row
        .split(/[,]/)
        .map((s) => Array.from(s))
        .flat()
        .map((s) => s.trim())
        .filter((word) => word.length > 0)
    })
    .filter((row) => row.length > 0)
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

const deleteUrlParams = (func) => {
  const params = new URLSearchParams(window.location.search)
  const keys = [...params.keys()].filter(func)
  keys.forEach((k) => params.delete(k))

  const baseUrl = window.location.href.split('?')[0]
  const newUrl = baseUrl + '?' + params.toString()
  history.replaceState(null, '', newUrl)
}

const { createElement, useState, useRef, useEffect } = React

function Icon(name) {
  return createElement('span', { className: 'material-symbols-outlined' }, name)
}

function Collapse({ title, ...props }, ...children) {
  return createElement(
    'details',
    {
      name: 'accordion',
      className: 'join-item collapse border-base-300 border',
      ...props,
    },
    createElement(
      'summary',
      { className: 'collapse-title' },
      createElement('h2', { className: 'text-3xl' }, title),
    ),
    createElement('div', { className: 'collapse-content' }, ...children),
  )
}

function Cell({ colorKey, ...props }) {
  return createElement(
    'div',
    {
      className: 'min-h-0 overflow-visible aspect-4/3',
      ...props,
    },
    colorKey &&
      createElement(
        'svg',
        {
          viewBox: '0 0 24 24',
          className: 'w-full stroke-1 stroke-zinc-300',
          style: { fill: `var(--color-${colorKey})` },
        },
        createElement('use', { href: '#stitch' }),
      ),
  )
}

function StitchContainer({ cells, className }) {
  return createElement(
    'div',
    {
      className: 'grid gap-0 shrink-0 ' + className,
      style: {
        gridTemplateColumns: `repeat(${(cells[0] || []).length}, 1fr)`,
      },
    },
    cells,
  )
}

function AutoTextArea({ onChange, className, ...props }) {
  const textareaRef = useRef(null)

  const setHeight = (textarea) => {
    // First set height to auto, allowing textarea height to shrink if necessary...
    textarea.style.height = 'auto'
    // ...then set height to height of content, plus some padding.
    textarea.style.height = textarea.scrollHeight + 2 + 'px'
  }

  // Set initial textarea height
  useEffect(() => {
    if (textareaRef.current) setHeight(textareaRef.current)
  }, [props.defaultValue])

  return createElement('textarea', {
    ref: textareaRef,
    className:
      'textarea font-mono ' +
      // Long text lines scroll instead of wrap
      'whitespace-pre wrap-normal overflow-x-auto ' +
      className,
    onChange: (e) => {
      setHeight(e.target)
      onChange(e.target.value)
    },
    ...props,
  })
}

function Switch({ onChange }, ...children) {
  return createElement(
    'label',
    { className: 'label' },
    createElement('input', {
      type: 'checkbox',
      className: 'toggle toggle-secondary',
      onChange: (e) => {
        onChange(e.target.checked)
      },
    }),
    ...children,
  )
}

function Zoom({ onChange }) {
  return createElement(
    'div',
    { className: 'w-full' },
    createElement('input', {
      type: 'range',
      min: '1',
      max: '6',
      step: '1',
      onChange: (e) => onChange(parseInt(e.target.value)),
      className: 'w-full range range-sm range-secondary',
    }),
    createElement(
      'div',
      { className: 'relative flex justify-between text-secondary' },
      createElement('span', {}, Icon('zoom_out')),
      createElement('span', {}, Icon('zoom_in')),
      createElement(
        'div',
        { className: 'absolute left-0 right-0 flex justify-between px-2' },
        createElement('span', { className: 'invisible' }, '|'),
        createElement('span', {}, '|'),
        createElement('span', {}, '|'),
        createElement('span', {}, '|'),
        createElement('span', {}, '|'),
        createElement('span', { className: 'invisible' }, '|'),
      ),
    ),
  )
}

function Button({ size, color, ...props }, ...children) {
  return createElement(
    'button',
    {
      className: `btn btn-${size || 'md'} btn-${color || 'neutral'}`,
      ...props,
    },
    ...children,
  )
}

function ShareButton() {
  const [showCopied, setShowCopied] = useState(false)

  const handleShare = () => {
    const url = window.location.href

    return navigator
      .share({
        title: 'Knitpicker Pattern',
        text: 'Check out this knit pattern!',
        url: url,
      })
      .catch((err) => {
        // User cancelled the share or there was an error
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err)
          return handleCopy(url)
        }
      })
  }

  const handleCopy = () => {
    const url = window.location.href
    return navigator.clipboard
      .writeText(url)
      .then(() => {
        setShowCopied(true)
        setTimeout(() => setShowCopied(false), 1600)
      })
      .catch((err) => {
        console.error('Failed to copy:', err)
      })
  }

  // Check if Web Share API is available (mobile devices)
  if (navigator.share) {
    return Button(
      { color: 'primary', onClick: handleShare },
      Icon('share'),
      'Share Pattern',
    )
  } else {
    return createElement(
      'div',
      { className: 'flex flex-col gap-0' },
      // Attach the tooltip to a hidden element so we can control its
      // appearance with JS alone
      createElement('span', {
        className:
          'tooltip tooltip-secondary tooltip-top' +
          (showCopied ? ' tooltip-open' : ''),
        'data-tip': 'Copied!',
      }),
      Button(
        { color: 'primary', onClick: handleCopy },
        Icon('link'),
        'Copy Pattern Link',
      ),
    )
  }
}

function ColorInputs({ colors, onChange }) {
  const colorInputsRef = useRef(null)

  const colorKeys = [...new Set(Object.keys(colors))].sort()

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
          if (!swapItem || item === swapItem) return

          // Get color keys from the items
          const colorKeyFrom = item.getAttribute('data-color-key')
          const colorKeyTo = swapItem.getAttribute('data-color-key')

          const colorFrom = colors[colorKeyFrom]
          const colorTo = colors[colorKeyTo]

          // Swap the colors
          onChange({
            [colorKeyFrom]: colorTo,
            [colorKeyTo]: colorFrom,
          })
        },
      })

      // Tear down the Sortable instance before creating a new one
      return () => instance.destroy()
    }
    // Stringify colors to avoid unnecessarily re-initializing Sortable
  }, [
    Object.entries(colors)
      .map((e) => e.join(':'))
      .join(','),
  ])

  const colorRows = colorKeys.flatMap((colorKey) => {
    const currentColor = colors[colorKey]

    return [
      createElement(
        'label',
        {
          key: `label-${colorKey}`,
          for: `color_${colorKey}`,
          className: 'label flex items-center',
        },
        colorKey,
      ),
      createElement(
        'div',
        {
          key: `input-${colorKey}`,
          className: 'input color-input-item flex items-center w-36 p-1',
          'data-color-key': colorKey,
        },
        createElement('input', {
          id: `color_${colorKey}`,
          type: 'color',
          value: currentColor,
          className: 'rounded-sm border-0',
          onChange: (e) => onChange({ [colorKey]: e.target.value }),
        }),
        createElement(
          'div',
          {
            className:
              'flex items-center drag-handle cursor-grab active:cursor-grabbing select-none text-lg',
          },
          Icon('drag_indicator'),
        ),
      ),
    ]
  })

  return createElement(
    'div',
    {
      ref: colorInputsRef,
      className: 'grid gap-x-2 gap-y-1',
      style: { gridTemplateColumns: 'auto 1fr' },
    },
    colorRows,
  )
}

function App({ defaultInput, defaultCustomColors }) {
  const [stitches, setStitches] = useState(parseStitches(defaultInput))
  const [customColors, setCustomColors] = useState(defaultCustomColors)
  const [zoom, setZoom] = useState(6)
  const [repeat, setRepeat] = useState(false)

  const onInputChanged = (input) => {
    setStitches(parseStitches(input))
    encodeGzip(input).then((encoded) => {
      updateUrlParams({ stitches: encoded })
    })
  }

  const onColorChanged = (colorKey, color) => {
    updateUrlParams({ [`color_${colorKey}`]: color })
    setCustomColors({
      ...customColors,
      [colorKey]: color,
    })
  }

  // Select default colors
  const colorKeys = [...new Set(stitches.flat())].sort()
  const defaultColors = Object.fromEntries(
    colorKeys.map((colorKey, i) => {
      const color = Math.floor((i / colorKeys.length) * 128 + 64)
        .toString(16)
        .padStart(2, '0')
      return [colorKey, `#${color}${color}${color}`]
    }),
  )

  // Max row length
  const maxLength = Math.max(...stitches.map((r) => r.length))

  const stitchCells = stitches.map((row, i) => {
    const cells = row.map((column, j) => {
      return Cell({ key: i + '_' + j, colorKey: column })
    })
    // Add additional cells to match length of longest row
    for (let j = cells.length; j < maxLength; j++) {
      cells.push(Cell({ key: i + '_' + j }))
    }
    return cells
  })

  // Add a row of empty cells as background for the last row's overflow
  for (let j = 0; j < maxLength; j++) {
    stitchCells.push(Cell({ key: 'bottom_' + j, className: 'aspect-4/1' }))
  }

  const repetitions = repeat ? Math.ceil(6 / zoom) : 1

  return createElement(
    'div',
    { className: 'flex gap-4 px-4 h-screen' },
    createElement('div', { className: 'fab' }, ShareButton()),
    createElement(
      'div',
      { className: 'flex-1 overflow-auto flex justify-center items-start' },
      createElement(
        'div',
        {
          className:
            (repeat ? 'w-full' : `transition-[width] w-${zoom}/6`) +
            ' my-4 p-4 overflow-hidden bg-zinc-300 rounded-lg flex',
          style: {
            ...Object.fromEntries(
              Object.entries({ ...defaultColors, ...customColors }).map(
                ([k, v]) => [`--color-${k}`, v],
              ),
            ),
          },
        },
        Array(repetitions)
          .fill()
          .map(() =>
            StitchContainer({
              cells: stitchCells,
              className: repeat ? `transition-[width] w-${zoom}/6` : 'w-full',
            }),
          ),
      ),
    ),

    createElement(
      'div',
      { className: 'w-auto overflow-auto min-w-1/4' },
      createElement(
        'div',
        { className: 'join join-vertical my-4 w-full' },
        Collapse(
          {
            open: Object.keys(defaultCustomColors).length === 0,
            title: [Icon('edit'), ' ', 'Pattern'],
          },
          AutoTextArea({
            className: 'w-full min-h-48',
            defaultValue: defaultInput,
            onChange: onInputChanged,
          }),
        ),

        Collapse(
          {
            open: Object.keys(defaultCustomColors).length > 0,
            title: [Icon('palette'), ' ', 'Color'],
          },
          createElement(
            'div',
            { className: 'flex justify-between items-start' },
            ColorInputs({
              colors: { ...defaultColors, ...customColors },
              onChange: (changes) => {
                updateUrlParams(
                  Object.fromEntries(
                    Object.entries(changes).map(([k, v]) => [`color_${k}`, v]),
                  ),
                )
                setCustomColors({
                  ...customColors,
                  ...changes,
                })
              },
            }),
            Button(
              {
                size: 'sm',
                color: 'secondary',
                onClick: () => {
                  deleteUrlParams((k) => k.startsWith('color_'))
                  setCustomColors({})
                },
                disabled: Object.keys(customColors).length === 0,
              },
              Icon('format_color_reset'),
              'Reset',
            ),
          ),
        ),

        Collapse(
          {
            title: [Icon('tune'), ' ', 'Display'],
          },
          createElement(
            'div',
            { className: 'flex flex-col gap-4' },
            Switch({ onChange: (value) => setRepeat(value) }, 'Repeat'),
            Zoom({ onChange: (value) => setZoom(value) }),
          ),
        ),
      ),
    ),
  )
}

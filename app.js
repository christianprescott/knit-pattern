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
      createElement('div', {
        className: 'h-full w-full border-1 border-zinc-300',
        style: { backgroundColor: `var(--color-${colorKey})` },
      }),
    // TODO: reinstate stitch shapes. They were disabled for performance reasons.
    // createElement(
    //   'svg',
    //   {
    //     viewBox: '0 0 24 24',
    //     className: 'w-full stroke-1 stroke-zinc-300',
    //     style: { fill: `var(--color-${colorKey})` },
    //   },
    //   createElement('use', { href: '#stitch' }),
    // ),
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

function Button(
  {
    size,
    color,
    soft,
    link,
    ghost,
    circle,
    outline,
    dash,
    className,
    ...props
  },
  ...children
) {
  const classes = Object.entries({
    circle,
    outline,
    dash,
    soft,
    link,
    ghost,
    size: size || 'md',
    color,
  })
    .map(([attr, value]) =>
      typeof value === 'string' ? `btn-${value}` : !!value ? `btn-${attr}` : '',
    )
    .join(' ')

  return createElement(
    'button',
    {
      className: `btn ${classes} ${className}`,
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
        { color: 'primary', onClick: handleCopy, className: 'shadow-md/30' },
        Icon('link'),
        'Copy Pattern Link',
      ),
    )
  }
}

function ColorPicker({ defaultColor, onChange, onSubmit, ...props }) {
  const [stagedColor, setStagedColor] = useState(defaultColor)
  const [isActive, setIsActive] = useState(false)
  const pickerRef = useRef(null)

  useEffect(() => {
    if (pickerRef.current) {
      const picker = new iro.ColorPicker(pickerRef.current, {
        width: 144, // .w-48
        margin: 'var(--spacing)', // .gap-1
        color: defaultColor,
        layoutDirection: 'horizontal',
        layout: [
          { component: iro.ui.Box },
          { component: iro.ui.Slider, options: { sliderType: 'hue' } },
        ],
      })
      picker.on('color:change', (color) => {
        setStagedColor(color.hexString)
        onChange(color.hexString)
      })
    }
  }, [isActive])

  return createElement(
    'div',
    {
      className: 'color-input-item rounded-lg border border-base-300',
      ...props,
    },
    createElement(
      'div',
      {
        className:
          'flex gap-1 m-1 transition-[height] ' + (isActive ? 'h-36' : 'h-8'),
      },
      createElement(
        'div',
        {
          onClick: () => setIsActive((prev) => !prev),
          className:
            'h-full rounded-sm flex flex-col gap-1 ' +
            (isActive ? 'w-12' : `w-full bg-[${defaultColor}]`),
        },
        isActive &&
          Button(
            {
              className: `border-0 rounded-sm w-full flex-2 bg-[${stagedColor}]`,
              onClick: () => onSubmit(stagedColor),
            },
            Icon('check'),
          ),
        isActive &&
          Button(
            {
              className: `border-0 rounded-sm w-full flex-1 bg-[${defaultColor}]`,
              onClick: () => {
                setStagedColor(defaultColor)
                onSubmit(defaultColor)
              },
            },
            Icon('close'),
          ),
      ),
      isActive &&
        createElement(
          'div',
          {
            ref: pickerRef,
            className: 'h-36',
          },
          // Some iro style properties are not configurable. Apply them this way
          // instead.
          // Support for inline <style> is not guaranteed but this
          // will degrade gracefully.
          createElement(
            'style',
            {},
            '.IroBox, .IroSlider, .IroSliderGradient { border-radius: var(--radius-sm) !important }',
          ),
        ),
      !isActive &&
        createElement(
          'div',
          {
            className:
              'flex items-center drag-handle cursor-grab active:cursor-grabbing select-none text-lg',
          },
          Icon('drag_indicator'),
        ),
    ),
  )
}

function ColorInputs({ colors, onChange, onSubmit }) {
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
          onSubmit({
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
          className: 'label flex items-center',
        },
        colorKey,
      ),
      createElement(ColorPicker, {
        key: `input-${colorKey}`,
        'data-color-key': colorKey,
        defaultColor: currentColor,
        onChange: (hex) => onChange({ [colorKey]: hex }),
        onSubmit: (hex) => onSubmit({ [colorKey]: hex }),
      }),
    ]
  })

  return createElement(
    'div',
    {
      ref: colorInputsRef,
      className: 'w-full grid gap-x-2 gap-y-1',
      style: { gridTemplateColumns: 'auto 1fr' },
    },
    colorRows,
  )
}

function Modal({ open, onClose, title }, ...children) {
  return createElement(
    'dialog',
    {
      className: 'modal',
      open: open,
    },
    createElement(
      'div',
      { className: 'modal-box' },
      createElement(
        'form',
        { method: 'dialog' },
        Button(
          {
            ghost: true,
            circle: true,
            onClick: onClose,
            className: 'absolute right-2 top-2',
          },
          Icon('close'),
        ),
      ),
      createElement('h3', { className: 'text-lg font-bold' }, title),
      createElement('div', { className: 'py-4' }, ...children),
    ),
    createElement('form', {
      method: 'dialog',
      className: 'modal-backdrop',
      onClick: onClose,
    }),
  )
}

function App({ defaultInput, defaultCustomColors }) {
  const [stitches, setStitches] = useState(parseStitches(defaultInput))
  const [customColors, setCustomColors] = useState(defaultCustomColors)
  const [stagedColors, setStagedColors] = useState({})
  const [zoom, setZoom] = useState(6)
  const [repeat, setRepeat] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

  const onInputChanged = (input) => {
    setStitches(parseStitches(input))
    encodeGzip(input).then((encoded) => {
      updateUrlParams({ stitches: encoded })
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
    createElement(
      'div',
      { className: 'relative flex-1 h-full' },
      createElement(
        'div',
        { className: 'overflow-auto h-full flex justify-center items-start' },
        createElement(
          'div',
          {
            className:
              (repeat ? 'w-full' : `transition-[width] w-${zoom}/6`) +
              ' my-4 p-4 overflow-hidden bg-zinc-300 rounded-lg flex',
            style: {
              ...Object.fromEntries(
                Object.entries({
                  ...defaultColors,
                  ...customColors,
                  ...stagedColors,
                }).map(([k, v]) => [`--color-${k}`, v]),
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
        { className: 'absolute bottom-4 right-4' },
        createElement(ShareButton),
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
          createElement(
            'div',
            { className: 'flex flex-col items-end' },
            createElement(AutoTextArea, {
              className: 'w-full min-h-48',
              defaultValue: defaultInput,
              onChange: onInputChanged,
            }),
            Button(
              {
                link: true,
                color: 'accent',
                onClick: () => setShowHelpModal(true),
              },
              'Help',
            ),
          ),
        ),

        Collapse(
          {
            open: Object.keys(defaultCustomColors).length > 0,
            title: [Icon('palette'), ' ', 'Color'],
          },
          createElement(
            'div',
            { className: 'flex flex-col items-end gap-1' },
            createElement(ColorInputs, {
              colors: { ...defaultColors, ...customColors },
              onChange: (changes) =>
                setStagedColors((prev) => ({ ...prev, ...changes })),
              onSubmit: (changes) => {
                updateUrlParams(
                  Object.fromEntries(
                    Object.entries(changes).map(([k, v]) => [`color_${k}`, v]),
                  ),
                )
                setStagedColors((prev) => {
                  Object.keys(changes).forEach((k) => {
                    delete prev[k]
                  })
                  return prev
                })
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
    Modal(
      {
        open: showHelpModal,
        onClose: () => setShowHelpModal(false),
        title: 'Creating a Pattern',
      },
      createElement(
        'div',
        { className: 'space-y-4' },
        createElement(
          'p',
          null,
          'Enter your knitting pattern in the text area above. Each character you type represents a stitch, and each line represents a row. You may separate with spaces or commas for readability but they are not required.',
        ),
        createElement(
          'p',
          null,
          'You can type anything you like - letters, numbers, symbols, or even emoji will automatically be assigned unique colors.',
        ),
        createElement(
          'p',
          null,
          'Customize colors by clicking on the swatches in the Color section. You can return to edit the pattern at any time.',
        ),
      ),
    ),
  )
}

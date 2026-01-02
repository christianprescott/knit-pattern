// Initialize textarea from URL parameter or default
const params = new URLSearchParams(window.location.search)
const defaultInput = params.has('stitches') ?
  params.get('stitches') :
  "A A A B A A A B\nA A B A A A B A\nA B A A A B A A\nB A A A B A A A\n"

// Initialize custom colors
const defaultCustomColors = {}
for (const [key, value] of params.entries()) {
  if (key.startsWith('color_')) {
    const colorKey = key.substring(6) // Remove 'color_' prefix
    defaultCustomColors[`--color-${colorKey}`] = value
  }
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

const { createElement } = React

function App() {
  const [stitches, setStitches] = React.useState(parseStitches(defaultInput))
  const [customColors, setCustomColors] = React.useState(defaultCustomColors)

  const onInputChanged = (v) => {
    const input = v.target.value
    updateUrlParams({ stitches: input })
    setStitches(parseStitches(input))
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

  const stitchCells = stitches.map((row, i) => {
    const cells = row.map((column, j) => {
      return createElement('div', {
        key: i + '_' + j,
        className: 'stitch',
        style: { backgroundColor: `var(--color-${column})`}
      })
    })
    // Add additional cells to match length of longest row
    for (let j = cells.length; j < maxLength; j++) {
      cells.push(createElement('div', {
        key: i + '_' + (cells.length + j),
        className: `stitch`
      }))
    }
    return cells
  })

  const colorInputs = colors.map((colorKey) => {
    const cssVarName = `--color-${colorKey}`
    const currentColor = customColors[cssVarName] || colorMap[cssVarName]

    return createElement('div', { key: colorKey },
      createElement('label', { for: `color_${colorKey}`}, `${colorKey}:`),
      createElement('input', {
        id: `color_${colorKey}`,
        type: 'color',
        value: currentColor,
        onChange: (e) => onColorChanged(colorKey, e.target.value)
      })
    )
  })

  return createElement('div', {},
    createElement('div', { id: 'inputContainer' },
      createElement('textarea', {
        id: 'stitchInput',
        defaultValue: defaultInput,
        onChange: onInputChanged
      }),
      createElement('div', { id: 'colorInputs' },
        colorInputs
      ),
    ),
    createElement('div', {
        id: 'stitchContainer',
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

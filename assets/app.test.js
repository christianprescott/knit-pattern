beforeAll(() => {
  // Mock React
  global.React = {
    // createElement: jest.fn(),
  }

  require('./app.js')
})

describe('parseStitches', () => {
  test('parses simple grid', () => {
    const input = 'ABC\nDEF'
    const result = parseStitches(input)
    expect(result).toEqual([
      ['A', 'B', 'C'],
      ['D', 'E', 'F'],
    ])
  })

  test('parses grid with commas', () => {
    const input = 'A,B,C\nD,E,F'
    const result = parseStitches(input)
    expect(result).toEqual([
      ['A', 'B', 'C'],
      ['D', 'E', 'F'],
    ])
  })

  test('parses grid with mixed separators', () => {
    const input = 'A B,C\nD,E F'
    const result = parseStitches(input)
    expect(result).toEqual([
      ['A', 'B', 'C'],
      ['D', 'E', 'F'],
    ])
  })

  test('filters out empty rows', () => {
    const input = 'A B C\n\nD E F\n'
    const result = parseStitches(input)
    expect(result).toEqual([
      ['A', 'B', 'C'],
      ['D', 'E', 'F'],
    ])
  })

  test('filters out empty cells', () => {
    const input = 'A  B   C \nD E F  '
    const result = parseStitches(input)
    expect(result).toEqual([
      ['A', 'B', 'C'],
      ['D', 'E', 'F'],
    ])
  })

  test('parses one character per stitch', () => {
    const input = 'AA BB CC\nDD EE FF'
    const result = parseStitches(input)
    expect(result).toEqual([
      ['A', 'A', 'B', 'B', 'C', 'C'],
      ['D', 'D', 'E', 'E', 'F', 'F'],
    ])
  })

  test('parses unicode character sequences', () => {
    const input = 'A💖A\n'
    const result = parseStitches(input)
    expect(result).toEqual([['A', '💖', 'A']])
  })

  test('does not parse some graphemes', () => {
    const input = '🏳️‍🌈'
    const result = parseStitches(input)
    expect(result[0].length).toEqual(4)
  })

  test('returns empty array for empty input', () => {
    const input = ''
    const result = parseStitches(input)
    expect(result).toEqual([])
  })
})

describe('decodeGzip', () => {
  test('decodes gzipped base64 string', async () => {
    const encoded = 'H4sIAAAAAAAACnNUcARCJy4wqeDIBQC3KjOGEAAAAA=='
    expect(await decodeGzip(encoded)).toBe('A A A B\nA A B A\n')
  })

  test('throws when input is invalid', async () => {
    const encoded = 'H4sIAA...AACnNUcARCJy...AA=='
    expect(decodeGzip(encoded)).rejects.toThrow('Invalid character')
  })
})

describe('decodeOrDefault', () => {
  test('returns default pattern for undefined input', async () => {
    expect(await decodeOrDefault()).toBe(
      'A A A B A A A B\nA A B A A A B A\nA B A A A B A A\nB A A A B A A A\n',
    )
  })

  test('returns default pattern for null', async () => {
    expect(await decodeOrDefault(null)).toBe(
      'A A A B A A A B\nA A B A A A B A\nA B A A A B A A\nB A A A B A A A\n',
    )
  })

  test('returns default pattern for empty string', async () => {
    expect(await decodeOrDefault('')).toBe(
      'A A A B A A A B\nA A B A A A B A\nA B A A A B A A\nB A A A B A A A\n',
    )
  })

  test('returns decoded input', async () => {
    const encoded = 'H4sIAAAAAAAACnNUcARCJy4wqeDIBQC3KjOGEAAAAA=='
    expect(await decodeOrDefault(encoded)).toBe('A A A B\nA A B A\n')
  })

  test('returns empty string for invalid input encoded input', async () => {
    // const encoded = 'IAAAAAAAACnNUcARCJy4wqeDIBQC3KjOGEAAAAA';
    const encoded =
      'IAAAAAAAACu2TQRLEIAgE7/MrjMr/f7TCCJKk9ryXtRJoZojEqkRkrSavCMutvSPal2XGddm1cmVQoVYZXrXSuxl95d489srw2LZWGOxkd2VY7gytMnoW9+jGOqqnyiB7JZWxmX2FESxydGPIWb0yjRHxwNMwGmGMtJY2/BYBO8Y2TCUj+s5mHIWYOSR2Z0IZGI+ONEZudh8+p12+pvOM4TN0RxY8YOqniYZKJlWPD0O3oWZotIbIDMnibegq9taH4ZVSr2zD/VPbb5uMXeU5gvm6R0+uxv8f/P0/+AGyZ5NLEwUAAA'
    expect(await decodeOrDefault(encoded)).toBe('')
  })

  test('returns literal input', async () => {
    const encoded = 'AAAB\nAABA\n'
    expect(await decodeOrDefault(encoded)).toBe('AAAB\nAABA\n')
  })
})

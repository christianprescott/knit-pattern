describe('parseStitches', () => {
  beforeAll(() => {
    // Mock React
    global.React = {
      createElement: jest.fn(),
      useState: jest.fn(),
    };

    // Mock window.location
    delete global.window.location;
    global.window.location = {
      search: '',
      href: 'http://localhost/',
    };

    // Mock history
    global.history = {
      replaceState: jest.fn(),
    };

    // Load app.js
    require('./app.js');
  });

  test('parses simple grid', () => {
    const input = 'ABC\nDEF';
    const result = parseStitches(input);
    expect(result).toEqual([
      ['A', 'B', 'C'],
      ['D', 'E', 'F']
    ]);
  });

  test('parses grid with commas', () => {
    const input = 'A,B,C\nD,E,F';
    const result = parseStitches(input);
    expect(result).toEqual([
      ['A', 'B', 'C'],
      ['D', 'E', 'F']
    ]);
  });

  test('parses grid with mixed separators', () => {
    const input = 'A B,C\nD,E F';
    const result = parseStitches(input);
    expect(result).toEqual([
      ['A', 'B', 'C'],
      ['D', 'E', 'F']
    ]);
  });

  test('filters out empty rows', () => {
    const input = 'A B C\n\nD E F\n';
    const result = parseStitches(input);
    expect(result).toEqual([
      ['A', 'B', 'C'],
      ['D', 'E', 'F']
    ]);
  });

  test('filters out empty cells', () => {
    const input = 'A  B   C \nD E F  ';
    const result = parseStitches(input);
    expect(result).toEqual([
      ['A', 'B', 'C'],
      ['D', 'E', 'F']
    ]);
  });

  test('parses one character per stitch', () => {
    const input = 'AA BB CC\nDD EE FF';
    const result = parseStitches(input);
    expect(result).toEqual([
      ['A', 'A', 'B', 'B', 'C', 'C'],
      ['D', 'D', 'E', 'E', 'F', 'F']
    ]);
  });

  test('parses unicode character sequences', () => {
    const input = 'A💖A\n';
    const result = parseStitches(input);
    expect(result).toEqual([
      ['A', '💖', 'A']
    ]);
  });

  test('does not parse some graphemes', () => {
    const input = '🏳️‍🌈';
    const result = parseStitches(input);
    expect(result[0].length).toEqual(4);
  });

  test('returns empty array for empty input', () => {
    const input = '';
    const result = parseStitches(input);
    expect(result).toEqual([]);
  });
});

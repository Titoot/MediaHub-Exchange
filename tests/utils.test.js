const { pathNormalize } = require('../utils'); 

describe('pathNormalize function', () => {
  test('should normalize path for Windows', () => {

    const inputPath = '\\test\\test\\';

    const result = pathNormalize(inputPath);

    expect(result).toBe('\\test\\test\\');
  });

  test('should normalize path for Unix', () => {

    const inputPath = '/test/test/';

    const result = pathNormalize(inputPath);

    expect(result).toBe('\\test\\test\\');
  });

  test('should handle paths without trailing slash (unix)', () => {

    const inputPath = '/test/test/test';

    const result = pathNormalize(inputPath);

    expect(result).toBe('\\test\\test\\test\\');
  });

  test('should handle paths without trailing slash (windows)', () => {

    const inputPath = '\\test\\test\\test';

    const result = pathNormalize(inputPath);

    expect(result).toBe('\\test\\test\\test\\');
  });
});

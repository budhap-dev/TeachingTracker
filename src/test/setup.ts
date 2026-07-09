import '@testing-library/jest-dom';
import { afterEach, expect, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

vi.stubGlobal('expect', expect);

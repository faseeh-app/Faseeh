import { vi } from 'vitest'

// Mock axios if needed for tests
vi.mock('axios', () => {
  const axiosMock = {
    get: vi.fn(),
    post: vi.fn(),
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn()
    })),
    isAxiosError: (error: unknown): error is any => {
      return error instanceof Error && error.name === 'AxiosError'
    }
  }

  return {
    default: axiosMock,
    AxiosError: class AxiosError extends Error {
      constructor(message: string) {
        super(message)
        this.name = 'AxiosError'
      }
    },
    isAxiosError: axiosMock.isAxiosError
  }
})

// Global test setup
beforeAll(() => {
  // Add any global test setup here
})

// Global test teardown
afterAll(() => {
  // Add any global test teardown here
  vi.clearAllMocks()
}) 
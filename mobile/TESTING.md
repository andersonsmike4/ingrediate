# Testing Infrastructure

The Ingrediate mobile app now has a complete testing infrastructure set up with Jest and React Native Testing Library.

## Setup

Testing dependencies and configuration have been added to the project:

- **Jest preset**: `jest-expo` (handles Expo-specific configuration)
- **Test runner**: `jest`
- **Testing library**: `@testing-library/react-native` (via jest-expo)

## Running Tests

```bash
npm test
```

or

```bash
yarn test
```

## Configuration Files

### package.json
- Added `"test": "jest"` script
- Added Jest configuration block with:
  - `preset: "jest-expo"`
  - `setupFiles: ["./jest.setup.js"]`
  - Transform ignore patterns for node_modules

### jest.setup.js
Global test setup file that mocks common Expo and React Native modules:
- `react-native-reanimated`
- `react-native-gesture-handler`
- `expo-secure-store`
- `@react-native-async-storage/async-storage`
- `expo-notifications`
- `expo-constants`

## Test Files

### API Client Tests
**Location**: `/Users/michael.anderson/Documents/ingrediate/mobile/src/api/__tests__/client.test.ts`

Tests for the core API client functionality:
- Token management (get, set, clear)
- GET requests with auth headers
- POST requests with JSON body
- POST requests with FormData
- PATCH requests
- DELETE requests
- 401 handling (clears token and throws)
- Error response handling

### Pantry API Tests
**Location**: `/Users/michael.anderson/Documents/ingrediate/mobile/src/api/__tests__/pantry.test.ts`

Tests for pantry-specific API functions:
- `fetchPantryItems()` - GET /api/pantry
- `addPantryItem()` - POST /api/pantry with name, category, expires_at, quantity
- `bulkAddPantryItems()` - POST /api/pantry/bulk
- `deletePantryItem()` - DELETE /api/pantry/:id
- `clearPantry()` - DELETE /api/pantry
- `voiceAddPantryItems()` - POST /api/pantry/voice
- `scanReceipt()` - POST /api/pantry/scan_receipt with FormData

### EmptyState Component Tests
**Location**: `/Users/michael.anderson/Documents/ingrediate/mobile/src/components/__tests__/EmptyState.test.tsx`

Tests for the EmptyState UI component:
- Title rendering
- Optional subtitle rendering
- Optional action button rendering
- Action button press handling
- ThemeContext integration

## Writing New Tests

### API Tests Pattern
```typescript
import { apiClient } from '../client';

jest.mock('../client');

describe('MyAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call correct endpoint', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: 'test' });

    const result = await myApiFunction();

    expect(apiClient.get).toHaveBeenCalledWith('/api/endpoint');
    expect(result).toEqual({ data: 'test' });
  });
});
```

### Component Tests Pattern
```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MyComponent from '../MyComponent';

// Mock ThemeContext if needed
jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: { /* theme colors */ },
    // ... other theme values
  }),
}));

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Expected Text')).toBeTruthy();
  });

  it('should handle press', () => {
    const onPress = jest.fn();
    const { getByText } = render(<MyComponent onPress={onPress} />);

    fireEvent.press(getByText('Button'));

    expect(onPress).toHaveBeenCalled();
  });
});
```

## Next Steps

To install the required testing dependencies, run:

```bash
npm install --save-dev jest-expo @testing-library/react-native @testing-library/jest-native
```

or

```bash
yarn add -D jest-expo @testing-library/react-native @testing-library/jest-native
```

Then you can run tests with:

```bash
npm test
```

## CI/CD Integration

To run tests in CI/CD pipelines, add this to your workflow:

```yaml
- name: Run tests
  run: npm test -- --ci --coverage --maxWorkers=2
```

## Coverage

To generate test coverage reports:

```bash
npm test -- --coverage
```

This will create a `coverage/` directory with detailed coverage reports.

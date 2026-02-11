# Testing Guide for SplitItUp

This document provides comprehensive information about the test suite for SplitItUp application (backend and frontend).

## Test Infrastructure

### Backend Testing
- **Framework**: Jest with TypeScript support via `ts-jest`
- **API Testing**: Supertest for HTTP endpoint testing
- **Mocking**: `jest-mock-extended` for Prisma client mocking
- **Coverage Target**: 70% for all metrics (branches, functions, lines, statements)

### Frontend Testing
- **Framework**: Jest with `jest-expo` preset
- **Component Testing**: React Native Testing Library
- **Coverage Target**: 60% for all metrics

## Setup

Dependencies have been installed automatically. If you need to reinstall:

```bash
# Backend
cd backend
npm install

# Frontend
cd app
npm install
```

## Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Frontend Tests

```bash
cd app

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

### Backend (`backend/__tests__/`)

```
__tests__/
├── setup.ts                    # Global test configuration
├── routes/                     # API endpoint tests
│   ├── auth.test.ts           # Authentication routes
│   ├── groups.test.ts         # Group management routes
│   ├── users.test.ts          # User routes (TODO)
│   ├── expenses.test.ts       # Expense routes (TODO)
│   └── ...
├── services/                   # Business logic tests
│   ├── debtSimplification.test.ts  # Debt algorithm tests
│   ├── auth.test.ts           # Auth service tests (TODO)
│   └── ...
└── middleware/                 # Middleware tests (TODO)
```

### Frontend (`app/__tests__/`)

```
__tests__/
├── setup.ts                    # Global test configuration
├── utils/
│   └── testUtils.tsx          # Test helpers and utilities
├── components/                 # Component tests (TODO)
├── screens/                    # Screen tests (TODO)
├── lib/
│   └── api.test.ts            # API client tests
└──store/
    └── authStore.test.tsx     # State management tests
```

## Test Categories

### 1. Unit Tests
- **Services**: Business logic, calculations, data transformations
- **Utilities**: Helper functions, formatters
- **Components**: React components in isolation

### 2. Integration Tests
- **API Routes**: Full request/response cycle with mocked database
- **User Flows**: Multi-step processes (e.g., signup → login → create group)

### 3. Coverage Areas

#### Backend Tests
- ✅ Authentication (signup, login, refresh token)
- ✅ Groups (CRUD operations, member management, invites)
- ✅ Debt Simplification Algorithm
- ⏳ Expenses (TODO)
- ⏳ Settlements (TODO)
- ⏳ Dashboard (TODO)
- ⏳ Analytics (TODO)

#### Frontend Tests
- ✅ API Client (GET, POST, PATCH, DELETE, error handling)
- ✅ Auth Store
- ⏳ Components (TODO)
- ⏳ Screens (TODO)
- ⏳ Hooks (TODO)

## Writing New Tests

### Backend Test Example

```typescript
import request from 'supertest';
import express from 'express';
import { yourRouter } from '../../src/routes/yourRoute';
import { prismaMock } from '../setup';

const app = express();
app.use(express.json());
app.use('/api/your-route', yourRouter);

describe('Your Route', () => {
  describe('GET /api/your-route', () => {
    it('should return data successfully', async () => {
      // Arrange: Mock database responses
      prismaMock.model.findMany.mockResolvedValue([/* mock data */]);

      // Act: Make request
      const response = await request(app)
        .get('/api/your-route')
        .set('Authorization', 'Bearer token');

      // Assert: Verify response
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });
  });
});
```

### Frontend Test Example

```typescript
import { render, fireEvent, waitFor } from '../utils/testUtils';
import YourComponent from '../../components/YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    const { getByText } = render(<YourComponent />);
    expect(getByText('Expected Text')).toBeDefined();
  });

  it('should handle user interaction', async () => {
    const { getByTestId } = render(<YourComponent />);
    const button = getByTestId('submit-button');
    
    fireEvent.press(button);
    
    await waitFor(() => {
      expect(/* verify expected outcome */).toBe(true);
    });
  });
});
```

## Best Practices

1. **Arrange-Act-Assert Pattern**: Structure tests clearly
2. **Mock External Dependencies**: Database, API calls, third-party services
3. **Test Edge Cases**: Empty data, errors, boundary conditions
4. **Descriptive Test Names**: Use `should` statements for clarity
5. **Isolation**: Each test should be independent
6. **Coverage**: Aim for high coverage but prioritize critical paths

## Mocking Strategy

### Backend
- **Database**: Prisma client is mocked using `jest-mock-extended`
- **Environment Variables**: Set in `__tests__/setup.ts`
- **External APIs**: Mock using `jest.fn()`

### Frontend
- **AsyncStorage**: Pre-mocked in setup
- **Expo Modules**: Mocked (router, constants, notifications, device)
- **API Calls**: Mock using `global.fetch`
- **Navigation**: Mock router functions

## Debugging Tests

```bash
# Run specific test file
npm test -- auth.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should login"

# Run with verbose output
npm test -- --verbose

# Update snapshots
npm test -- --updateSnapshot
```

## CI/CD Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Backend Tests
  run: |
    cd backend
    npm test -- --coverage --ci

- name: Run Frontend Tests
  run: |
    cd app
    npm test -- --coverage --ci
```

## Troubleshooting

### Common Issues

1. **"Cannot find module"**: Ensure all dependencies are installed
2. **Timeout errors**: Increase timeout in jest.config.js
3. **Mock not working**: Check mock setup in `__tests__/setup.ts`
4. **Type errors**: Ensure @types packages are installed

### Getting Help

- Check test output for specific error messages
- Review existing test files for patterns
- Ensure setup files are being loaded correctly

## Next Steps

To complete test coverage:

1. **Backend**:
   - Add tests for remaining routes (expenses, settlements, users, etc.)
   - Test middleware (auth, error handling)
   - Test all service functions

2. **Frontend**:
   - Add component tests for all major components
   - Test all screens/pages
   - Test custom hooks
   - Add E2E tests with Detox (optional)

## Performance

Current test execution times (approximate):
- Backend: ~5-10 seconds for full suite
- Frontend: ~10-15 seconds for full suite

Coverage reports are generated in:
- Backend: `backend/coverage/`
- Frontend: `app/coverage/`

Open `coverage/lcov-report/index.html` in a browser to view detailed coverage reports.

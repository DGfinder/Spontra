# Contributing to Spontra

Thank you for your interest in contributing to Spontra! This document provides guidelines and information for contributors.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain a professional atmosphere

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Go 1.21+ installed
- Node.js 18+ installed
- Docker and Docker Compose
- Git configured with your name and email

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/spontra.git
   cd spontra
   ```
3. Run the setup script:
   ```bash
   ./scripts/setup.sh
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names:
- `feature/add-price-alerts`
- `bugfix/fix-search-timeout`
- `hotfix/security-patch`
- `docs/update-api-documentation`

### Commit Messages

Follow the conventional commits format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Maintenance tasks

Examples:
```
feat(search): add price sorting functionality
fix(auth): resolve JWT token expiration issue
docs(api): update search endpoint documentation
```

### Pull Request Process

1. Create a feature branch from `develop`
2. Make your changes following our coding standards
3. Write or update tests
4. Run the full test suite
5. Update documentation if needed
6. Submit a pull request

#### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

## Coding Standards

### Go Code Style

- Follow [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)
- Use `gofmt` for formatting
- Run `golangci-lint` for linting
- Write meaningful comments for exported functions
- Use meaningful variable and function names

Example:
```go
// GetUserByID retrieves a user by their unique identifier
func GetUserByID(ctx context.Context, userID string) (*User, error) {
    if userID == "" {
        return nil, errors.New("user ID cannot be empty")
    }
    // Implementation...
}
```

### JavaScript/TypeScript Style

- Use TypeScript for type safety
- Follow ESLint configuration
- Use Prettier for formatting
- Prefer functional components with hooks
- Use meaningful component and variable names

Example:
```typescript
interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  loading: boolean;
}

export const SearchForm: React.FC<SearchFormProps> = ({ onSearch, loading }) => {
  // Implementation...
};
```

### Database Guidelines

- Use descriptive table and column names
- Always include created_at and updated_at timestamps
- Use UUIDs for primary keys
- Add appropriate indexes for performance
- Include foreign key constraints

### API Design

- Follow RESTful conventions
- Use consistent naming (snake_case for JSON)
- Include proper HTTP status codes
- Implement proper error handling
- Add request/response validation

## Testing Guidelines

### Unit Tests

- Write tests for all public functions
- Use table-driven tests in Go
- Mock external dependencies
- Aim for >80% code coverage

Go example:
```go
func TestGetUserByID(t *testing.T) {
    tests := []struct {
        name    string
        userID  string
        want    *User
        wantErr bool
    }{
        {
            name:   "valid user ID",
            userID: "123",
            want:   &User{ID: "123", Email: "test@example.com"},
            wantErr: false,
        },
        {
            name:    "empty user ID",
            userID:  "",
            want:    nil,
            wantErr: true,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := GetUserByID(context.Background(), tt.userID)
            if (err != nil) != tt.wantErr {
                t.Errorf("GetUserByID() error = %v, wantErr %v", err, tt.wantErr)
                return
            }
            if !reflect.DeepEqual(got, tt.want) {
                t.Errorf("GetUserByID() = %v, want %v", got, tt.want)
            }
        })
    }
}
```

### Integration Tests

- Test complete workflows
- Use test databases
- Clean up after tests
- Test error scenarios

### Frontend Tests

- Test user interactions
- Test component rendering
- Test API integration
- Use React Testing Library

## Documentation

### Code Documentation

- Document all public APIs
- Include usage examples
- Update README files
- Add inline comments for complex logic

### API Documentation

- Document all endpoints
- Include request/response examples
- Specify error codes
- Update OpenAPI/Swagger specs

## Performance Guidelines

### Backend Performance

- Use connection pooling
- Implement caching strategies
- Optimize database queries
- Use appropriate data structures
- Profile and benchmark code

### Frontend Performance

- Optimize bundle size
- Use lazy loading
- Implement proper caching
- Minimize re-renders
- Use React.memo and useMemo appropriately

## Security Guidelines

### Authentication & Authorization

- Never store passwords in plain text
- Use secure JWT implementations
- Implement proper session management
- Validate all user inputs
- Use HTTPS in production

### Data Security

- Encrypt sensitive data
- Use environment variables for secrets
- Implement proper access controls
- Regular security audits
- Follow OWASP guidelines

## Debugging

### Common Issues

1. **Service won't start**: Check environment variables and dependencies
2. **Database connection failed**: Verify database is running and credentials are correct
3. **Tests failing**: Ensure test database is clean and properly configured
4. **Build errors**: Check Go modules and dependencies

### Debugging Tools

- Use debugger in your IDE
- Add logging statements
- Use `docker logs` for container issues
- Use `kubectl logs` for Kubernetes issues

## Release Process

### Versioning

We use Semantic Versioning (SemVer):
- `MAJOR.MINOR.PATCH`
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes

### Release Workflow

1. Create release branch from `main`
2. Update version numbers
3. Update CHANGELOG.md
4. Create and test release candidate
5. Merge to `main` and tag release
6. Deploy to production

## Community

### Getting Help

- Check existing issues and documentation
- Ask questions in GitHub Discussions
- Join our Slack channel (if available)
- Attend office hours (if scheduled)

### Reporting Issues

When reporting bugs:
1. Use the issue template
2. Include system information
3. Provide steps to reproduce
4. Include relevant logs
5. Specify expected vs actual behavior

### Feature Requests

For new features:
1. Check if it already exists
2. Describe the use case
3. Provide implementation ideas
4. Consider backward compatibility
5. Be open to feedback

## Recognition

Contributors will be recognized:
- In the CONTRIBUTORS.md file
- In release notes
- Through GitHub's contributor insights
- In project documentation

## Legal

By contributing to Spontra, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Spontra! Your efforts help make air travel more accessible and affordable for everyone.
# DOGLC Digital Wallet - Coding Configuration Guide

## 🛠️ Development Environment Setup

This document outlines the coding configuration and development standards for
the DOGLC Digital Wallet project.

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **VS Code**: Latest version recommended
- **PowerShell**: For Windows development
- **Wrangler CLI**: Cloudflare Workers development tool

### Quick Setup

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Setup Development Environment**:

   ```bash
   npm run setup
   ```

3. **Install Recommended VS Code Extensions**:
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Install recommended extensions from `.vscode/extensions.json`

## 📝 Configuration Files Overview

### Core Configuration Files

| File                      | Purpose          | Description                                 |
| ------------------------- | ---------------- | ------------------------------------------- |
| `.eslintrc.json`          | Code Linting     | JavaScript/HTML linting rules and standards |
| `.prettierrc`             | Code Formatting  | Automatic code formatting configuration     |
| `.editorconfig`           | Editor Settings  | Cross-editor coding style consistency       |
| `.vscode/settings.json`   | VS Code Settings | Workspace-specific VS Code configuration    |
| `.vscode/tasks.json`      | Build Tasks      | Automated build, deploy, and test tasks     |
| `.vscode/launch.json`     | Debug Config     | Debugging and launch configurations         |
| `.vscode/extensions.json` | Extensions       | Recommended VS Code extensions              |

### Coding Standards

#### JavaScript/HTML Standards

- **Indentation**: 2 spaces (no tabs)
- **Line Length**: Max 100 characters
- **Quotes**: Single quotes for JavaScript
- **Semicolons**: Required
- **Template Literals**: Use for multi-line strings and interpolation

#### Naming Conventions

- **Variables**: camelCase (`userName`, `apiEndpoint`)
- **Functions**: camelCase (`getUserData`, `processPayment`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_RETRY_COUNT`)
- **Files**: kebab-case (`user-service.js`, `payment-handler.js`)

#### File Structure

- **Workers**: `workers/[worker-name]/src/index.js`
- **Configurations**: `wrangler-[worker-name].toml`
- **Tests**: `test-[feature].ps1`
- **Documentation**: `docs/[feature].md`

## 🔧 Development Workflow

### Available Scripts

| Script | Command              | Description                          |
| ------ | -------------------- | ------------------------------------ |
| Setup  | `npm run setup`      | Install dependencies and format code |
| Lint   | `npm run lint`       | Fix linting issues automatically     |
| Format | `npm run format`     | Format code with Prettier            |
| Test   | `npm test`           | Run all worker tests                 |
| Deploy | `npm run deploy:all` | Deploy all workers to production     |

### Development Tasks (VS Code)

Use **Ctrl+Shift+P** → **Tasks: Run Task** to access:

- **Deploy All Workers**: Deploy entire system
- **Deploy [Worker] Worker**: Deploy specific worker
- **Dev - [Worker] Worker**: Start development server
- **Test All Workers**: Run comprehensive tests
- **Lint Code**: Fix code style issues
- **Format Code**: Auto-format all files
- **System Health Check**: Verify system status

### Debug Configurations

Use **F5** or **Ctrl+F5** to launch:

- **PowerShell: Launch Current File**: Debug PS1 scripts
- **Test Bot Direct**: Test Telegram bot functionality
- **Deploy All Workers**: Deploy with debugging

## 🎨 Code Formatting

### Auto-formatting Setup

1. **Format on Save**: Enabled by default in VS Code settings
2. **Format on Paste**: Enabled for immediate formatting
3. **ESLint Auto-fix**: Fixes issues automatically on save

### Manual Formatting

```bash
# Format all files
npm run format

# Check formatting without changes
npm run format:check

# Lint and fix JavaScript
npm run lint

# Check linting without changes
npm run lint:check
```

## 🧪 Testing Standards

### Test File Naming

- **Worker Tests**: `test-[worker-name].ps1`
- **Feature Tests**: `test-[feature-name].ps1`
- **Integration Tests**: `test-[integration-scope].ps1`

### Test Categories

1. **Unit Tests**: Individual function testing
2. **Integration Tests**: Worker-to-worker communication
3. **System Tests**: End-to-end functionality
4. **Health Checks**: System monitoring and diagnostics

## 📊 Code Quality

### ESLint Rules

- **No Console**: Warnings for console.log (use structured logging)
- **Prefer Const**: Require const for non-reassigned variables
- **No Unused Variables**: Clean up unused imports/variables
- **Consistent Spacing**: Enforce consistent spacing rules

### Prettier Rules

- **Single Quotes**: Use single quotes for strings
- **Semicolons**: Always require semicolons
- **Trailing Commas**: ES5-compatible trailing commas
- **Bracket Spacing**: Spaces inside object literals

## 🚀 Deployment Configuration

### Environment-Specific Configs

- **Development**: `wrangler.toml` (local testing)
- **Production**: `wrangler-[worker].toml` (deployed workers)

### Deployment Workflow

1. **Code Changes**: Make changes in appropriate worker
2. **Lint & Format**: `npm run setup`
3. **Test Locally**: `npm run dev:[worker]`
4. **Test Integration**: `npm test`
5. **Deploy**: `npm run deploy:[worker]` or `npm run deploy:all`

## 🔍 Troubleshooting

### Common Issues

**Linting Errors**:

```bash
npm run lint
```

**Formatting Issues**:

```bash
npm run format
```

**Extension Issues**:

- Check `.vscode/extensions.json`
- Reload VS Code window
- Reinstall recommended extensions

**PowerShell Execution Policy**:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📚 Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [ESLint Configuration](https://eslint.org/docs/user-guide/configuring/)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)
- [VS Code Tasks](https://code.visualstudio.com/docs/editor/tasks)

---

**✅ Configuration Complete**: Your development environment is now properly
configured with consistent coding standards, automated formatting, and
comprehensive testing capabilities.

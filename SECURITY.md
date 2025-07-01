# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| 1.x     | :x:                |

## Reporting a Vulnerability

Please report security vulnerabilities to the project maintainers through GitHub's security advisory feature.

## Security Considerations

### Runtime Security
The CLN tool implements several security measures:

1. **Input Validation**: All user inputs (repository names, URLs, branch names) are sanitized
2. **Path Traversal Protection**: Directory operations are restricted to safe paths
3. **Command Injection Prevention**: Git commands use proper escaping
4. **Secure Temp Files**: Uses cryptographically random temporary file names

### Development Dependencies
The project uses development dependencies (unbuild, vitest) that have moderate severity vulnerabilities in their dependency tree (esbuild). These vulnerabilities:
- Only affect the development/build environment
- Do not impact the production runtime
- Are related to the dev server in esbuild (CVE reference: GHSA-67mh-4wv8-2f99)

Since these tools are only used during development and the vulnerability doesn't affect the distributed package, the risk is minimal. We monitor for updates that will resolve these issues without breaking changes.

### Best Practices
- Never commit sensitive data or credentials
- Use HTTPS URLs for Git repositories when possible
- Regularly update dependencies when security patches are available
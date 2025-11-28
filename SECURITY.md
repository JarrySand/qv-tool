# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

1. **Do NOT** create a public GitHub issue for security vulnerabilities.
2. Send an email to the project maintainers with:
   - A description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact assessment
   - Any suggested fixes (if applicable)

### What to Expect

- **Initial Response**: We aim to acknowledge receipt of your report within 48 hours.
- **Status Updates**: We will provide updates on the progress of addressing the vulnerability.
- **Resolution**: Once the vulnerability is fixed, we will:
  - Release a patch version
  - Credit you in the release notes (unless you prefer anonymity)
  - Notify you before public disclosure

### Scope

The following are considered in-scope for security reports:

- Authentication bypass
- Authorization flaws
- SQL injection
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Remote code execution
- Sensitive data exposure
- Server-side request forgery (SSRF)

### Out of Scope

- Issues in dependencies (please report these to the respective projects)
- Social engineering attacks
- Physical attacks
- Denial of service attacks that require significant resources

## Security Best Practices for Deployment

When deploying QV-Tool, please ensure:

1. **Environment Variables**
   - Set `AUTH_SECRET` with a strong, random value in production
   - Never commit `.env` files to version control
   - Use different secrets for each environment

2. **Database**
   - Use strong, unique passwords for database access
   - Enable SSL/TLS for database connections
   - Restrict database network access

3. **HTTPS**
   - Always use HTTPS in production
   - Set appropriate security headers (HSTS, etc.)

4. **Access Control**
   - Keep admin tokens secure and private
   - Regularly rotate secrets and tokens
   - Monitor for suspicious activity

## Acknowledgments

We appreciate the security research community's efforts in helping keep QV-Tool secure. Contributors who report valid security issues will be acknowledged here (with their permission).

# 🔒 Security Policy

## Supported Versions

Only the latest version of InstaBot is currently supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability within InstaBot, please follow these steps for responsible disclosure:

1. **Do not** disclose the vulnerability publicly until it has been addressed.
2. Submit the vulnerability by creating a new issue with the title "SECURITY VULNERABILITY" on the project repository.
3. Include detailed information about the vulnerability, including:
   - A clear description of the vulnerability
   - Steps to reproduce the vulnerability
   - Potential impact
   - Suggested fixes, if any
4. Allow time for the vulnerability to be addressed before any public disclosure.

## Security Best Practices

When using InstaBot, follow these security best practices:

### Configuration Security

- Never commit your `config.json` file with real credentials to a public repository
- Use environment variables for sensitive information where possible
- Regularly change your Instagram password
- Use a dedicated Instagram account for your bot, not your personal account

### Code Security

- Keep all dependencies updated to the latest secure versions
- Review your custom commands for potential security issues
- Be cautious when installing third-party extensions or commands
- Don't expose your bot's API endpoints publicly
- Monitor your bot's logs for suspicious activity

### Data Security

- Regularly back up your data files
- Limit what data your bot collects to what's absolutely necessary
- Encrypt sensitive data at rest and in transit where possible
- Implement proper access controls if multiple people manage your bot

## Instagram API Usage

Please note that using automation with Instagram may violate their Terms of Service. Use this bot responsibly and at your own risk. We recommend:

- Limiting the frequency of actions to avoid rate limits
- Not using the bot for spam or harassment
- Following Instagram's community guidelines
- Being respectful of other users' privacy and content

## Security Updates

Security updates will be announced in the project repository. To stay informed about security issues:

- Watch the repository for updates
- Regularly check for new releases
- Update to the latest version as soon as possible

## Disclaimer

This bot is provided "as is" without warranty of any kind. The creators and contributors are not responsible for any misuse of this software or any violations of Instagram's Terms of Service that may result from its use.

---

By using InstaBot, you acknowledge that you have read and understood this security policy.
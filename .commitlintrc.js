/**
 * Commitlint Configuration
 *
 * Enforces Conventional Commits format for all commit messages.
 * https://www.conventionalcommits.org/
 */

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type enum
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation changes
        'style', // Code style changes (formatting, missing semicolons, etc)
        'refactor', // Code refactoring
        'perf', // Performance improvements
        'test', // Adding or updating tests
        'build', // Build system changes
        'ci', // CI/CD changes
        'chore', // Other changes (maintenance, dependencies, etc)
        'revert', // Revert a previous commit
      ],
    ],
    // Subject case
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
    // Subject length
    'subject-max-length': [2, 'always', 100],
    'subject-min-length': [2, 'always', 3],
    // Body
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [2, 'always', 100],
    // Footer
    'footer-leading-blank': [1, 'always'],
    // Scope
    'scope-case': [2, 'always', 'lower-case'],
    // Header
    'header-max-length': [2, 'always', 100],
  },
}

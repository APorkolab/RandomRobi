module.exports = {
  env: {
    node: true,
    es2021: true,
    mocha: true
  },
  extends: [
    'airbnb-base'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    // Custom rules for the project
    'no-console': 'off', // Allow console.log for server logging
    'consistent-return': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: 'next' }],
    'no-param-reassign': ['error', { props: false }],
    'max-len': ['error', { code: 120 }],
    'linebreak-style': 'off', // Handle different OS line endings
    'import/no-dynamic-require': 'off',
    'global-require': 'off',
    'no-process-exit': 'off', // Allow process.exit in server startup
    'prefer-destructuring': ['error', {
      array: false,
      object: true
    }],
    'object-curly-newline': ['error', {
      ObjectExpression: { consistent: true },
      ObjectPattern: { consistent: true }
    }],
    'comma-dangle': ['error', 'only-multiline'],
    'arrow-parens': ['error', 'always'],
    'no-underscore-dangle': 'off', // Allow _id and similar
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: ['**/*.test.js', '**/*.spec.js']
    }]
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js'],
      rules: {
        'no-unused-expressions': 'off', // For chai expect statements
        'prefer-arrow-callback': 'off', // Mocha works better with function()
        'func-names': 'off'
      }
    }
  ]
};

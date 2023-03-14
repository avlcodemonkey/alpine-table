module.exports = {
    root: true,
    extends: [
        'eslint:recommended',
    ],    
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    env: {
        es6: true,
        node: true,
        jest: true,
        browser: true
    },
    rules: {
        'indent': ['error', 4, { 'ignoredNodes': ['TemplateLiteral *'] }],
        'linebreak-style': [2,'windows'],
        'class-methods-use-this': 'off',
        'max-len': ['error', 160],
        'import/extensions': 'off',
        'no-plusplus': 'off',
        'no-console': ['warn', { 'allow': ['warn', 'error'] }],
        'no-underscore-dangle': ['error', { 'allow': [ '_index'] }],
        'no-trailing-spaces': ['error'],
        'quotes': ['error', 'single'],
        'comma-dangle': ['error', 'always-multiline'],
    },
    ignorePatterns: ['/**/__tests__','.eslintrc.cjs']
};

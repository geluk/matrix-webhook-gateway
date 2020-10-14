module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: "tsconfig.json"
    },
    plugins: [
        "@typescript-eslint",
    ],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "airbnb-typescript/base",
    ],
    rules: {
        "class-methods-use-this": ["off"],
        "no-underscore-dangle": ["error", {
                "allowAfterThis": true,
            }],
        "no-unused-vars": ["off"],
        "@typescript-eslint/no-unused-vars": ["warn", {
            "argsIgnorePattern": "^_",
        }],
    },
};
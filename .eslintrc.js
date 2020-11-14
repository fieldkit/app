module.exports = {
    root: true,
    env: {
        "node": true
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "plugin:vue/base",
        "plugin:vue/recommended"
    ],
    parser: "vue-eslint-parser",
    parserOptions: {
        "ecmaVersion": 2020,
        "parser": "@typescript-eslint/parser",
        "project": "./tsconfig.json",
        "sourceType": "module",
        "extraFileExtensions": [".vue"]
    },
    plugins: ["vue", "@typescript-eslint", "nativescript"],
    rules: {
        "@typescript-eslint/no-unused-vars": [
            "warn",
            {
                "args": "all",
                "argsIgnorePattern": "^(_|state$|commit$|dispatch$)",
                "varsIgnorePattern": "^(_|state$|commit$|dispatch$)"
            }
        ],
        "vue/html-indent": "off",
        "vue/html-self-closing": "off",
        "vue/max-attributes-per-line": "off",
        "vue/attribute-hyphenation": "off",
        "nativescript/no-short-imports": "error"
    },
    globals: {
        "_L": "readonly"
    }
}

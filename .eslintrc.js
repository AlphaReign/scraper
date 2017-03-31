module.exports = {
    "parser": "babel-eslint",
    "env": {
        "es6": true,
        "node": true
    },
    "extends": "eslint:all",
    "parserOptions": {
        "sourceType": "module"
    },
    /*
        "off" or 0 - turn the rule off
        "warn" or 1 - turn the rule on as a warning (doesn’t affect exit code)
        "error" or 2 - turn the rule on as an error (exit code is 1 when triggered)
    */
    "rules": {
        "camelcase": "off",
        "capitalized-comments": "off",
        "class-methods-use-this": "off",
        "dot-location": ["error", "property"],
        "eol-last": "off",
        "func-style": "off",
        "id-length": "off",
        "indent": ["error", "tab"],
        "init-declarations": "off",
        "max-len": ["error", 180],
        "multiline-ternary": "off",
        "no-confusing-arrow": ["error", {"allowParens": true}],
        "no-console": "off",
        "no-underscore-dangle": "off",
        "no-extra-parens": "off",
        "no-magic-numbers": "off",
        "no-shadow": "off",
        "no-tabs": "off",
        "no-sync": "off",
        "no-ternary": "off",
        "no-undefined": "off",
        "object-curly-spacing": ["error", "always"],
        "one-var": "off",
        "padded-blocks": "off",
        "quote-props": "off",
        "quotes": "off",
        "require-jsdoc": "off",
        "require-await": "off",
        "max-statements-per-line": ["error", { "max": 2 }]
    }
};

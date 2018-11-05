module.exports = {
    "env" : {
        "es6": true,
        "browser": true,
        "node":true,
        "mocha": true
    },
    "extends": [
        "eslint:recommended",
        "google"
    ],
    "parserOptions":{
        "ecmaVersion": 2017
    },
    "rules": {
        "quotes":[2,"double"],
        "semi": [2, "always"],
        "no-console": 0,
        "no-undef": 0,
        "max-len": ["error", { "code": 120 }],
        "comma-dangle": [
            "error",
            {
                "arrays": "never",
                "objects": "never",
                "imports": "never",
                "exports": "never",
                "functions": "ignore"
            }
        ],
        "strict": [2, "global"]
    },
    "plugins": [
        "standard"
    ],
    "globals": {
        "AWS": true
    }
};

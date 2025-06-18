Guide: Use prompt
@commitlint/prompt-cli helps with fast authoring of commit messages and ensures they adhere to the commit convention configured in commitlint.config.js.

Install
Create a git repository if needed


git init
Create a package.json if needed


npm init
Install and configure if needed


npm install --save-dev @commitlint/cli @commitlint/config-conventional @commitlint/prompt-cli

echo "export default { extends: ['@commitlint/config-conventional'] };" > commitlint.config.js
Provide a shortcut
To make prompt-cli easy to use, add a npm run-script to your package.json


{
  "scripts": {
    "commit": "commit"
  }
}
1
2
3
4
5
Test the prompt by executing


git add .
npm run commit
An alternative to @commitlint/prompt-cli: commitizen
Another way to author commit messages that adhere to the commit convention configured in commitlint.config.js is to use commitizen. For more information, checkout their official website.

commitlint provides two adapters for commitizen:

@commitlint/prompt provides a way to interact same as @commitlint/prompt-cli
@commitlint/cz-commitlint is inspired by cz-conventional-changelog, it provides a more modern way to interact.

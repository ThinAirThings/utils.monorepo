Configuration
Config via file
@commitlint/cli picks up configuration from the following files:

.commitlintrc
.commitlintrc.json
.commitlintrc.yaml
.commitlintrc.yml
.commitlintrc.js
.commitlintrc.cjs
.commitlintrc.mjs
.commitlintrc.ts
.commitlintrc.cts
commitlint.config.js
commitlint.config.cjs
commitlint.config.mjs
commitlint.config.ts
commitlint.config.cts
The file is expected

to contain valid JavaScript / Typescript
export a configuration object
adhere to the schema outlined below
Configuration files are resolved using cosmiconfig.

Config via package.json
You can add a commitlint field in package.json (or package.yaml) with an object that follows the below structure.

Config option CLI
Add the path to the configuration file. Example: commitlint --config commitlint.config.js

Configuration object example

const Configuration = {
  /*
   * Resolve and load @commitlint/config-conventional from node_modules.
   * Referenced packages must be installed
   */
  extends: ["@commitlint/config-conventional"],
  /*
   * Resolve and load conventional-changelog-atom from node_modules.
   * Referenced packages must be installed
   */
  parserPreset: "conventional-changelog-atom",
  /*
   * Resolve and load @commitlint/format from node_modules.
   * Referenced package must be installed
   */
  formatter: "@commitlint/format",
  /*
   * Any rules defined here will override rules from @commitlint/config-conventional
   */
  rules: {
    "type-enum": [2, "always", ["foo"]],
  },
  /*
   * Array of functions that return true if commitlint should ignore the given message.
   * Given array is merged with predefined functions, which consist of matchers like:
   *
   * - 'Merge pull request', 'Merge X into Y' or 'Merge branch X'
   * - 'Revert X'
   * - 'v1.2.3' (ie semver matcher)
   * - 'Automatic merge X' or 'Auto-merged X into Y'
   *
   * To see full list, check https://github.com/conventional-changelog/commitlint/blob/master/%40commitlint/is-ignored/src/defaults.ts.
   * To disable those ignores and run rules always, set `defaultIgnores: false` as shown below.
   */
  ignores: [(commit) => commit === ""],
  /*
   * Whether commitlint uses the default ignore rules, see the description above.
   */
  defaultIgnores: true,
  /*
   * Custom URL to show upon failure
   */
  helpUrl:
    "https://github.com/conventional-changelog/commitlint/#what-is-commitlint",
  /*
   * Custom prompt configs
   */
  prompt: {
    messages: {},
    questions: {
      type: {
        description: "please input type:",
      },
    },
  },
};

export default Configuration;
NOTE

CJS format is supported as well:


module.exports = Configuration;
Typescript configuration
Configuration can also be a typescript file.

Relevant types and enums can be imported from @commitlint/types.

Below you can see main changes from a standard js file:


import type { UserConfig } from "@commitlint/types"; 
import { RuleConfigSeverity } from "@commitlint/types"; 

const Configuration: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  parserPreset: "conventional-changelog-atom",
  formatter: "@commitlint/format",
  rules: {
    "type-enum": [RuleConfigSeverity.Error, "always", ["foo"]], 
  },
  // ...
};

export default Configuration;
Shareable configuration
Every commitlint configuration can extend other commitlint configurations. Specify configurations to extend via the .extends key, using ids that can be resolved by the node resolve algorithm.

This means installed npm packages and local files can be used.

npmlocal

npm install --save-dev commitlint-config-lerna @commitlint/config-conventional

commitlint.config.js

export default {
  extends: [
    'lerna' // prefixed with commitlint-config-*,
    '@commitlint/config-conventional' // scoped packages are not prefixed
  ]
}
More information can be found in the Concepts – shareable config section.

Parser presets
The parser preset used to parse commit messages can be configured. Use ids resolvable by the node resolve algorithm.

This means installed npm packages and local files can be used.

npmlocal

npm install --save-dev conventional-changelog-atom

commitlint.config.js

export default {
  parserPreset: "conventional-changelog-atom",
};
Formatter
Commitlint can output the issues encountered in different formats, if necessary. Use ids resolvable by the node resolve algorithm.


export default {
  formatter: "@commitlint/format",
};
Rules
Refer to Rules for a complete list of available rules.

Prompt
Config command-line submit interaction, works with @commitlint/cz-commitlint.

Refer to Prompt Config for details.


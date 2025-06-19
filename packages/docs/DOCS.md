# Metro Bundler Documentation Summary

## Overview

Metro is a JavaScript bundler optimized for React Native projects, designed to efficiently transform and bundle JavaScript code for mobile app development. It supports large codebases and offers features like hot module reloading, asset management, and custom transformations, making it a powerful tool for mobile developers.

## Installation

Metro is typically included in React Native projects. You can configure it using a `metro.config.js`, `metro.config.json`, or by adding a `metro` field in your `package.json`. To specify a custom configuration file, use the `--config <path/to/config>` option with the Metro CLI.

## Basic Usage

1. **Create a Configuration File**: Set up a `metro.config.js` file in your project root.
   ```javascript
   module.exports = {
     resolver: {
       /* resolver options */
     },
     transformer: {
       /* transformer options */
     },
     serializer: {
       /* serializer options */
     },
     server: {
       /* server options */
     },
     watcher: {
       /* watcher options */
     }
   };
   ```

2. **Run Metro**: Start Metro using the React Native CLI, which will automatically use your configuration.
   ```bash
   npx react-native start
   ```

## Core Functions / Classes

1. **cacheStores**
   - **Summary**: Defines storage adapters for Metro's transformer cache.
   - **Example**:
     ```javascript
     module.exports = {
       cacheStores: [
         new MetroCache.FileStore({ root: '/path/to/cache' })
       ]
     };
     ```

2. **projectRoot**
   - **Summary**: Sets the root folder of your project.
   - **Example**:
     ```javascript
     module.exports = {
       projectRoot: '/path/to/project'
     };
     ```

3. **watchFolders**
   - **Summary**: Lists directories outside of `projectRoot` that contain source files.
   - **Example**:
     ```javascript
     module.exports = {
       watchFolders: ['/path/to/other/folder']
     };
     ```

4. **transformerPath**
   - **Summary**: Specifies the path to a custom transformer module.
   - **Example**:
     ```javascript
     module.exports = {
       transformerPath: require.resolve('my-custom-transformer')
     };
     ```

5. **getTransformOptions**
   - **Summary**: A function to calculate additional transformer options.
   - **Example**:
     ```javascript
     module.exports = {
       transformer: {
         getTransformOptions: async () => ({
           transform: {
             inlineRequires: true,
           },
         }),
       },
     };
     ```

6. **minifierPath**
   - **Summary**: Path to the minifier used after transformation.
   - **Example**:
     ```javascript
     module.exports = {
       transformer: {
         minifierPath: 'metro-minify-terser'
       }
     };
     ```

7. **port**
   - **Summary**: Sets the port for the Metro server.
   - **Example**:
     ```javascript
     module.exports = {
       server: {
         port: 8081
       }
     };
     ```

8. **resolveRequest**
   - **Summary**: Customizes the module resolution algorithm.
   - **Example**:
     ```javascript
     module.exports = {
       resolver: {
         resolveRequest: (context, moduleName, platform) => {
           if (moduleName.startsWith('custom:')) {
             return { filePath: '/custom/path', type: 'sourceFile' };
           }
           return context.resolveRequest(context, moduleName, platform);
         }
       }
     };
     ```

9. **blockList**
   - **Summary**: Excludes paths from Metro's file map.
   - **Example**:
     ```javascript
     module.exports = {
       resolver: {
         blockList: [/node_modules\/some-package/]
       }
     };
     ```

10. **mergeConfig**
    - **Summary**: Merges multiple Metro configurations.
    - **Example**:
      ```javascript
      const { mergeConfig } = require('metro-config');
      const configA = { /* ... */ };
      const configB = { /* ... */ };
      module.exports = mergeConfig(configA, configB);
      ```

## Advanced Features

- **Custom Transformers**: Define custom transformers for specific file types or transformations.
- **Performance Logging**: Use `unstable_perfLoggerFactory` to log performance metrics.
- **Module Resolution Customization**: Customize module resolution with `resolveRequest` and related options.

## Common Pitfalls

- **Configuration Overwrites**: Be cautious when merging configurations, as arrays and functions do not deeply merge and may overwrite existing settings.
- **Symlink Resolution**: Ensure symlink targets are within `watchFolders` to avoid resolution issues.

## Further Reading

- [Metro Bundler Documentation](https://facebook.github.io/metro/docs)
- [React Native Metro Configuration](https://reactnative.dev/docs/next/metro-config)
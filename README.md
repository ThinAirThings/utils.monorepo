# @thinair/utilities

This is a Turborepo starter powered by pnpm.

## What's inside?

This Turborepo includes the following packages:

- `@thinair/web-utils`: Shared React utilities for web projects.
- `@thinair/tsconfig`: Shared `tsconfig.json`s used throughout the monorepo.

Each package is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [Changesets](https://github.com/changesets/changesets) for versioning and publishing

### Useful commands

- `pnpm build` - Build all packages
- `pnpm dev` - Develop all packages
- `pnpm lint` - Lint all packages
- `pnpm changeset` - Generate a changeset
- `pnpm clean` - Clean up all `node_modules` and `dist` folders

### Changing the npm organization scope

The npm organization scope for this starter is `@thinair`. To change this, you'll need to do the following:

- Update the `name` field in all `package.json` files to replace `@thinair` with your desired scope.
- Re-run `pnpm install`

## Versioning and Publishing Packages

This repository uses [Changesets](https://github.com/changesets/changesets) combined with a `main` and `next` branching strategy to manage releases. The process is automated with a GitHub Action.

-   `main`: This branch contains the latest stable code. Merging pull requests into `main` triggers a production release to npm.
-   `next`: This is the primary development branch. All feature branches should be created from `next`, and all pull requests should target `next`.

To get this working, you will need to create an `NPM_TOKEN` and `GITHUB_TOKEN` in your repository settings. It's also highly recommended to install the [Changesets bot](https://github.com/apps/changeset-bot) on your GitHub repository.

### Step 1: Development Workflow (on `next`)

1.  **Branch from `next`**. All new work should start from the `next` branch.
    ```sh
    git checkout next
    git pull origin next
    git checkout -b your-feature-branch
    ```
2.  **Make your code changes**.
3.  **Run the changeset command**. Once you're ready to commit, run the following command from the root of the repository:
    ```sh
    pnpm changeset
    ```
4.  **Select packages and provide details**. The command will prompt you to select which packages you want to release, define the version bump type (patch, minor, or major), and write a message that will be added to the `CHANGELOG.md`. This creates a new markdown file in the `.changeset` directory.
5.  **Commit the changeset file**. Add the newly generated `.changeset/*.md` file along with your code changes to your commit.
6.  **Open a Pull Request to `next`**. Push your branch and open a PR targeting the `next` branch. The Changesets bot will comment on your PR, showing the pending release information.
7.  **Merge into `next`**. Once approved, merge your PR. This accumulates your changes and the versioning intent on the `next` branch, but does **not** trigger a release.

### Step 2: Release Workflow (promoting `next` to `main`)

When you are ready to publish a new release with all the changes accumulated on the `next` branch:

1.  **Open a Pull Request from `next` to `main`**. This "Release PR" will contain all the new features and fixes ready for production. The Changesets bot will provide a consolidated view of all versions and changelog entries for the upcoming release.
2.  **Merge the PR into `main`**. Once this Release PR is merged, the release process is fully automated by the `.github/workflows/release.yml` GitHub Action.

Here's what happens automatically:

1.  **The Action Triggers**: The push to `main` starts the `Release` workflow.
2.  **Version Bump & Publish**: The `changesets/action` consumes all accumulated changeset files, bumps package versions, updates changelogs, publishes the packages to npm, and creates Git tags.
3.  **Commit back to `main`**: The action commits the version updates (e.g., "Release @thinair/web-utils@0.1.0") and updated `CHANGELOG.md` files back to the `main` branch.

### Step 3: Post-Release Sync

After a successful release, it's important to update the `next` branch with the version bumps from `main`.

1.  **Merge `main` back into `next`**:
    ```sh
    git checkout next
    git pull origin next
    git merge main
    git push origin next
    ```

This flow ensures that `main` is always a clean, releasable reflection of your production code, while `next` serves as the integration branch for upcoming features.

### npm

If you want to publish package to the public npm registry and make them publicly available, this is already setup.

To publish packages to a private npm organization scope, **remove** the following from each of the `package.json`'s

```diff
- "publishConfig": {
-  "access": "public"
- },
```

### GitHub Package Registry

See [Working with the npm registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#publishing-a-package-using-publishconfig-in-the-packagejson-file)

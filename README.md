# vpnnews

The Site is generated using [vuepress](https://vuepress.vuejs.org/) and [vuepress-theme-plume](https://github.com/pengzhanbo/vuepress-theme-plume)

## Install

```sh
pnpm install
```

## Usage

```sh
# start dev server
pnpm docs:dev
# build for production
pnpm docs:build
# preview production build in local
pnpm docs:preview
# update vuepress and theme
pnpm vp-update
```

The development server opens at `http://127.0.0.1:8081/`. After `pnpm docs:build`, the production preview opens at `http://127.0.0.1:4175/`.

## Publish articles with Cloudflare Pages

The production site at `https://vpnnew.net` is deployed directly from the `main` branch by the Cloudflare Pages project `vpnnew-net`.

1. Edit or add Markdown articles under `docs/`.
2. Commit and push the changes to `main`.
3. Wait for the **Cloudflare Pages** check to succeed, then verify the published article on the production site.

Configure the Pages project with these values:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Automatic deployments | Enabled |
| Build command | `pnpm run docs:build` |
| Build output directory | `docs/.vuepress/dist` |
| Root directory | Leave empty (repository root) |

Article publishing does not run GitHub Actions or depend on updates to the `gh-pages` branch. Historical failed GitHub Actions checks remain attached to their original commits.

## Manual legacy deployment

`.github/workflows/deploy.yml` is available through **Actions > Manual legacy deployment > Run workflow** for manual maintenance of the Analytics Worker and the legacy GitHub Pages deployment. It is not triggered by a push. Running it still requires GitHub Actions access, repository write permissions, and the appropriate Cloudflare secrets for Worker deployment.

For direct Worker deployment and local validation, see [analytics-worker/README.md](analytics-worker/README.md). Worker code changes require a separate deployment; the Pages build publishes the static site.

## Documents

- [vuepress](https://vuepress.vuejs.org/)
- [vuepress-theme-plume](https://theme-plume.vuejs.press/)

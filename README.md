# Drupal + Playwright + DDEV Example

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Getting Started](#getting-started)
  - [Running Playwright From Your Host](#running-playwright-from-your-host)
  - [Running Playwright in DDEV](#running-playwright-in-ddev)
- [Architecture Notes](#architecture-notes)
  - [As a separate container or stacked in the web service?](#as-a-separate-container-or-stacked-in-the-web-service)
  - [Why not use SeleniumHQ/docker-selenium containers?](#why-not-use-seleniumhqdocker-selenium-containers)
  - [Why a separate package.json?](#why-a-separate-packagejson)
- [Implementation Highlights](#implementation-highlights)
  - [Example Tests](#example-tests)
  - [Docker build bind and cache mounts](#docker-build-bind-and-cache-mounts)
- [Not Implemented Yet](#not-implemented-yet)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

This repository contains an example setup of browser tests with the following notable features:

1. Playwright dependencies are entirely **optional and off by default**. This significantly reduces initial setup time for instances that don't need to run browser tests.
2. Runs tests against 5 different desktop and mobile configurations.
3. Support for running **playwright outside ddev**. This is useful for developers using Playwright's test recorder.
4. Comprehensive build caches to reduce build times when images need to be rebuilt, such as when DDEV upgrades.
5. A VNC server available both at https://drupal-playwright.ddev.site:7900/ and with a VNC client like macOS Screen Sharing at `localhost:5900` - password is `secret`.

## Getting Started

First, bootstrap the Drupal install.

```console
git clone ...
cd drupal-playwright
ddev start
ddev composer install
ddev drush -y site:install
```

### Running Playwright From Your Host

If you have nodejs, nvm, and yarn installed you can run Playwright from your host system, instead of inside a container.

```console
cd test/playwright
yarn
yarn playwright test
yarn playwright test --headed # To watch browsers fly!
yarn playwright test --debug # To fix your broken tests!
yarn playwright codegen # To record new tests from scratch!
```

### Running Playwright in DDEV

```console
ddev install-playwright # This downloads all playwright dependencies into ddev.
ddev playwright test # See .ddev/commands/web for the playwright command.
# Now, connect to the VNC server at https://drupal-playwright.ddev.site:7900/ with password `secret`.
ddev playwright test --headed
ddev playwright test --debug
```

## Architecture Notes

### As a separate container or stacked in the web service?

I originally tried setting this up using Microsoft's official Playwright containers. However, I ran into an issue with Firefox and DDEV:

([BUG] Running Playwright on Firefox inside a Docker container always hangs forever)[https://github.com/microsoft/playwright/issues/16491]

The way to fix this is to run the container as a non-root user. However, to be able to write test reports, the Playwright process has to know what the user and group IDs of the host user are. [DDEV doesn't support this](https://github.com/orgs/ddev/discussions/4733), and it's a somewhat uncommon edge case.

As well, we know that eventually we want to be able to run drush commands during test setup. Most likely, we will want to be able to import a database dump (avoiding the relative slowness of `drush site:install` for larger projects) as well as pass an ID to the browsers to use to identify database prefixes like how Drupal core tests do. This would require an additional 200MB of downloads to install Docker inside the Playwright container, so it could exec commands in the web container. My initial tests worked, but combined with the Firefox bug and the general DX it seemed better to just have one big container.

### Why not use SeleniumHQ/docker-selenium containers?

Selenium offers [prebuilt Docker containers with VNC servers](https://github.com/SeleniumHQ/docker-selenium). However, they only provide containers for Chrome and Firefox. Playwright natively also supports Safari (via Webkit) and Edge browsers.

### Why a separate package.json?

When I started, I originally had playwright in our project's root `package.json`. However, that made it more complicated when switching between running tests in DDEV and on the host. For example, if you use a node dependency that requires native modules, then running `yarn install` on the host would break those other processes (like sass) inside DDEV.

## Implementation Highlights

### Example Tests

The tests included in (test/playwright/tests)[test/playwright/tests] both prove that Playwright is working, but also highlight common pitfalls with browser tests that are independent of any test framework. Take a look at [test/playwright/tests/drupal-login.spec.ts](test/playwright/tests/drupal-login.spec.ts) to learn more.

### Docker build bind and cache mounts

It gets old fast working on this type of project when you have to wait 2-5 minutes for containers to rebuild. Docker now supports "mount" caches that are persisted even when containers are rebuilt from scratch. Using these to share the apt and yarn caches leads to significant time savings. See [.ddev/web-build/disabled.Dockerfile.playwright](.ddev/web-build/disabled.Dockerfile.playwright) for notes on how this all works.

Playwright's internal cache system uses the path of the project that `yarn playwright install` is called from. If that changes, it will download browsers all over again. Combined with a pre-start hook in [.ddev/config.yaml](.ddev/config.yaml), a bind mount lets us copy the `test/playwright` directory into the container at build time, ensuring all the paths line up correctly without having to keep a copy of the files in the final image (and likely confusing mutagen). This is only possible because of DDEV's flexibility in allowing pre-start hooks that run on the host 🙌.

## Not Implemented Yet

1. Support for isolated Drupal databases for parallel tests.
2. Copy and paste from the VNC session isn't working.

import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: [
    '../src/components/**/*.stories.@(ts|tsx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  staticDirs: ['../public'],
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },
  webpackFinal: async (config) => {
    const tailwindPlugin = require('@tailwindcss/postcss');

    config.module?.rules?.forEach((rule) => {
      if (rule && typeof rule === 'object' && Array.isArray((rule as any).use)) {
        (rule as any).use.forEach((use: any) => {
          if (
            use &&
            typeof use === 'object' &&
            typeof use.loader === 'string' &&
            use.loader.includes('postcss-loader')
          ) {
            use.options = use.options ?? {};
            use.options.postcssOptions = use.options.postcssOptions ?? {};
            const origPlugins = use.options.postcssOptions.plugins;
            use.options.postcssOptions.plugins = (...args: any[]) => {
              const resolved =
                typeof origPlugins === 'function'
                  ? origPlugins(...args)
                  : origPlugins ?? [];
              return [...resolved, tailwindPlugin()];
            };
          }
        });
      }
    });

    return config;
  },
};

export default config;

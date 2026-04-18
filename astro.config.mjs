// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { visit } from 'unist-util-visit';

function rehypeAmazonRel() {
  /** @param {import('hast').Root} tree */
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'a' && typeof node.properties?.href === 'string' && node.properties.href.includes('amazon.co.jp')) {
        const existing = Array.isArray(node.properties.rel) ? node.properties.rel : [];
        const rel = new Set([...existing, 'sponsored', 'nofollow', 'noopener', 'noreferrer']);
        node.properties.rel = [...rel];
      }
    });
  };
}

export default defineConfig({
  site: 'https://magazine.happyharem.com',
  output: 'static',
  integrations: [
    mdx({
      rehypePlugins: [rehypeAmazonRel],
    }),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});

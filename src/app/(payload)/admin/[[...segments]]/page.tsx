import { RootPage, generatePageMetadata } from "@payloadcms/next/views";
import { importMap } from "../importMap";

type Args = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] }>;
};

export const generateMetadata = ({ params, searchParams }: Args) =>
  generatePageMetadata({ config: import("@payload-config"), params, searchParams });

export default function Page({ params, searchParams }: Args) {
  return RootPage({ config: import("@payload-config"), params, searchParams, importMap });
}

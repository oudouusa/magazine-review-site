import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import { importMap } from "./importMap";
import type { ServerFunctionClient } from "payload";
import type { ReactNode } from "react";

const configPromise = import("@payload-config").then((m) => m.default);

const serverFunction: ServerFunctionClient = async (args) => {
  "use server";
  return handleServerFunctions({
    ...args,
    config: configPromise,
    importMap,
  });
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootLayout config={configPromise} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  );
}

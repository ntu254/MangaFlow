import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../shared/lib/lovable-error-reporting";
import { RoleProvider } from "../shared/lib/role";
import { Toaster } from "../shared/ui/shadcn/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Lovable App" },
      {
        name: "description",
        content: "Perfect Code Tracker ensures 100% accurate code generation.",
      },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Lovable App" },
      {
        property: "og:description",
        content: "Perfect Code Tracker ensures 100% accurate code generation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Lovable App" },
      {
        name: "twitter:description",
        content: "Perfect Code Tracker ensures 100% accurate code generation.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/241b9943-d76a-4bb8-bd92-ef64b4a7ca64/id-preview-5b737991--b26ef334-05ef-4df3-a2d8-e92e66311ea4.lovable.app-1781784434473.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/241b9943-d76a-4bb8-bd92-ef64b4a7ca64/id-preview-5b737991--b26ef334-05ef-4df3-a2d8-e92e66311ea4.lovable.app-1781784434473.png",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

// Inline script that runs synchronously before paint to apply the saved theme
// class and prevent FOUC (Flash of Unstyled Content / light→dark flash).
const THEME_INIT_SCRIPT = `
(function(){
  try {
    var t = localStorage.getItem('br-theme');
    if (t === 'light') { document.documentElement.classList.remove('dark'); }
    else { document.documentElement.classList.add('dark'); }
  } catch(e) { document.documentElement.classList.add('dark'); }
})()
`;

// Some browser extensions inject `bis_skin_checked` attributes before React hydrates.
// React correctly reports that as a mismatch, but it is outside the app's HTML.
const EXTENSION_HYDRATION_WARNING_FILTER_SCRIPT = `
(function(){
  if (typeof window === 'undefined' || window.__mfHydrationWarningFilterInstalled) return;
  window.__mfHydrationWarningFilterInstalled = true;

  var shouldIgnore = function(args) {
    var text = '';
    for (var i = 0; i < args.length; i++) {
      var value = args[i];
      if (typeof value === 'string') text += value + '\\n';
      else if (value && typeof value.message === 'string') text += value.message + '\\n';
    }
    var isHydrationWarning = /hydration|hydrated|server rendered HTML/i.test(text);
    var isExtensionMutation = text.indexOf('bis_skin_checked') !== -1 || text.indexOf('chrome-extension://') !== -1;
    return isHydrationWarning && isExtensionMutation;
  };

  var originalError = console.error;
  console.error = function() {
    if (shouldIgnore(arguments)) return;
    return originalError.apply(console, arguments);
  };
})()
`;

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: EXTENSION_HYDRATION_WARNING_FILTER_SCRIPT }} />
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <RoleProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster />
      </RoleProvider>
    </QueryClientProvider>
  );
}

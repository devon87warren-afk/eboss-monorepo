# Firebase Studio workspace configuration for eboss-monorepo
# Docs: https://firebase.google.com/docs/studio/customize-workspace
{ pkgs, ... }: {
  channel = "stable-24.05";

  packages = [
    pkgs.nodejs_20
  ];

  env = {
    # Tell corepack / pnpm where to store its global store inside the workspace
    # so it survives workspace restarts without re-downloading packages.
    PNPM_HOME = "/home/user/.pnpm";
  };

  idx = {
    extensions = [
      "dbaeumer.vscode-eslint"
      "bradlc.vscode-tailwindcss"
      "esbenp.prettier-vscode"
    ];

    previews = {
      enable = true;
      previews = {
        # apps/manager (Vite) is the unified EBOSS platform.
        # vite.config.ts binds to 0.0.0.0:3000 — IDX injects $PORT for its
        # preview panel. We forward $PORT → vite --port so the panel works.
        web = {
          command = [
            "pnpm"
            "--dir" "apps/manager"
            "run" "dev"
            "--" "--port" "$PORT" "--host"
          ];
          manager = "web";
          env = {
            PORT = "$PORT";
            # Silence Vite's "network" banner noise in IDX terminal
            BROWSER = "none";
          };
        };
      };
    };

    workspace = {
      # Runs once when the workspace is first created.
      onCreate = {
        # Enable corepack so Node uses the pnpm version declared in
        # package.json ("packageManager": "pnpm@10.20.0")
        enable-corepack = "corepack enable";
        # Install all workspace dependencies
        install-deps = "pnpm install";
      };

      # Runs every time the workspace (re)starts.
      onStart = {
        # Nothing to start by default — the preview panel starts apps/manager
        # on demand. Add long-running background tasks here if needed, e.g.:
        #   watch-types = "pnpm turbo run typecheck --watch";
      };
    };
  };
}

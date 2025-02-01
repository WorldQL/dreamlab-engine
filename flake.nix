{
  description = "dreamlab-engine";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

  outputs = { nixpkgs }: let
    supportedSystems = ["x86_64-linux" "aarch64-darwin" "x86_64-darwin"];
    forAllSystems = f: nixpkgs.lib.genAttrs supportedSystems (
      system: f (import nixpkgs { inherit system; })
    );
  in {
    devShells = forAllSystems (pkgs: {
      default = pkgs.mkShell {
        buildInputs = [
          pkgs.rustup
          pkgs.stdenv
          pkgs.deno
          pkgs.nodejs
        ];
      };
    });
  };
}

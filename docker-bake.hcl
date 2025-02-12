group "default" {
  targets = ["client", "editor", "multiplayer"]
}

target "docker-metadata-action" {}

target "client" {
  inherits = ["docker-metadata-action"]

  context = "."
  dockerfile = "./docker/client.Dockerfile"
}

target "editor" {
  inherits = ["docker-metadata-action"]

  context = "."
  dockerfile = "./docker/editor.Dockerfile"
}

target "multiplayer" {
  inherits = ["docker-metadata-action"]

  context = "."
  dockerfile = "./docker/multiplayer.Dockerfile"
}

group "default" {
  targets = ["client", "editor", "multiplayer"]
}

target "client" {
  context = "."
  dockerfile = "./docker/client.Dockerfile"
}

target "editor" {
  context = "."
  dockerfile = "./docker/editor.Dockerfile"
}

target "multiplayer" {
  context = "."
  dockerfile = "./docker/multiplayer.Dockerfile"
}

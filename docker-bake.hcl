group "default" {
  targets = ["client", "editor", "multiplayer"]
}

target "client" {
  context = "."
  dockerfile = "./docker/client.Dockerfile"
  tags = ["awa"]
}

target "editor" {
  context = "."
  dockerfile = "./docker/editor.Dockerfile"
}

target "multiplayer" {
  context = "."
  dockerfile = "./docker/multiplayer.Dockerfile"
}

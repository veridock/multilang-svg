#!/bin/bash

# Install wasm-pack if not installed
cargo install wasm-pack

# Create a new Rust project
mkdir -p ./wasm
pushd wasm

cargo init

# Add wasm-bindgen to Cargo.toml
echo "[dependencies]" >> Cargo.toml
echo "wasm-bindgen = \"0.2\"" >> Cargo.toml

# Copy our Rust source
cp ../fibonacci.rs src/lib.rs

# Build the WASM module
wasm-pack build --target web

# Copy the generated files back
mkdir -p ../dist
mv pkg/fibonacci_bg.wasm ../dist/
mv pkg/fibonacci.js ../dist/

popd

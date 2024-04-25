# memo
## 1. captured git version （base）
- github
    https://github.com/ChatGPTNextWeb/ChatGPT-Next-Web
- latest tag
    v2.10.3
- latest commit
    e756506 （Commits on Feb 20, 2024）

## 2. Run on local docker
- **local dev**
    `yarn && yarn dev`
- **make docker image && push to private registry**
    `./docker-release-image.sh`
- **about Sharp Missing In Production**
    `export NEXT_SHARP_PATH=/Users/sun/Documents/GitHub/xyz.chat/node_modules/sharp`

## 3. Compile tauri app
- **Install**
    `cd src-tauri`
    `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
    `source ~/.cargo/env`
    `cargo clean`
    `cargo build --release`
    `yarn tauri build`
    `yarn tauri dev`
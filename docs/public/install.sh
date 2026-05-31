#!/usr/bin/env sh
set -eu

repo="dannylee1020/swan"
asset_name="swan-chromium.zip"
version="${SWAN_VERSION:-${1:-}}"
install_dir="${SWAN_INSTALL_DIR:-"$HOME/.swan/extension/chrome-mv3"}"
releases_api_url="https://api.github.com/repos/$repo/releases"

tmp_dir="$(mktemp -d 2>/dev/null || mktemp -d -t swan)"
cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT INT TERM

zip_path="$tmp_dir/$asset_name"
extract_dir="$tmp_dir/extract"
next_dir="$install_dir.next"
backup_dir="$install_dir.previous"

fetch_url() {
  url="$1"

  if command -v curl >/dev/null 2>&1; then
    curl -fsL --retry 3 --connect-timeout 20 \
      -H "Accept: application/vnd.github+json" \
      "$url"
    return
  fi

  if command -v wget >/dev/null 2>&1; then
    wget -qO- --header="Accept: application/vnd.github+json" "$url"
    return
  fi

  echo "Swan install needs curl or wget to resolve releases." >&2
  exit 1
}

resolve_latest_download_url() {
  releases_json="$(fetch_url "$releases_api_url")" || {
    echo "Could not reach GitHub releases API: $releases_api_url" >&2
    exit 1
  }
  latest_url="$(
    printf '%s\n' "$releases_json" |
      sed -n 's/.*"browser_download_url"[[:space:]]*:[[:space:]]*"\([^"]*\/'"$asset_name"'\)".*/\1/p' |
      head -n 1
  )"

  if [ -z "$latest_url" ]; then
    echo "Could not find $asset_name on any published GitHub release." >&2
    echo "Set SWAN_VERSION to a release tag or SWAN_DOWNLOAD_URL to a direct zip URL." >&2
    exit 1
  fi

  printf '%s\n' "$latest_url"
}

if [ -n "${SWAN_DOWNLOAD_URL:-}" ]; then
  download_url="$SWAN_DOWNLOAD_URL"
elif [ -n "$version" ]; then
  download_url="https://github.com/$repo/releases/download/$version/$asset_name"
else
  download_url="$(resolve_latest_download_url)"
fi

download() {
  if command -v curl >/dev/null 2>&1; then
    curl -fL --retry 3 --connect-timeout 20 -o "$zip_path" "$download_url"
    return
  fi

  if command -v wget >/dev/null 2>&1; then
    wget -O "$zip_path" "$download_url"
    return
  fi

  echo "Swan install needs curl or wget to download $download_url" >&2
  exit 1
}

extract_zip() {
  mkdir -p "$extract_dir"

  if command -v unzip >/dev/null 2>&1; then
    unzip -q "$zip_path" -d "$extract_dir"
    return
  fi

  if command -v bsdtar >/dev/null 2>&1; then
    bsdtar -xf "$zip_path" -C "$extract_dir"
    return
  fi

  echo "Swan install needs unzip or bsdtar to extract $asset_name" >&2
  exit 1
}

open_extensions_page() {
  if [ "${SWAN_NO_OPEN:-}" = "1" ]; then
    return
  fi

  if [ "$(uname -s)" = "Darwin" ] && command -v open >/dev/null 2>&1; then
    open "chrome://extensions" >/dev/null 2>&1 || true
    return
  fi

  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "chrome://extensions" >/dev/null 2>&1 || true
  fi
}

echo "Downloading Swan Chromium extension..."
echo "Source: $download_url"
download
extract_zip

if [ ! -f "$extract_dir/manifest.json" ]; then
  echo "Downloaded Swan zip is invalid: manifest.json was not found at the zip root." >&2
  exit 1
fi

mkdir -p "$(dirname "$install_dir")"
rm -rf "$next_dir" "$backup_dir"
mkdir -p "$next_dir"
cp -R "$extract_dir"/. "$next_dir"/

if [ -d "$install_dir" ]; then
  mv "$install_dir" "$backup_dir"
fi

mv "$next_dir" "$install_dir"
rm -rf "$backup_dir"

echo ""
echo "Swan is installed at:"
echo "  $install_dir"
echo ""
echo "Load Swan in Chromium:"
echo "  1. Open chrome://extensions"
echo "  2. Enable Developer Mode"
echo "  3. Click Load unpacked"
echo "  4. Select: $install_dir"
echo ""
echo "For updates, rerun this installer, then click reload for Swan in chrome://extensions."
echo "Do not remove Swan from the browser unless you intend to clear extension-local settings."
echo ""

open_extensions_page

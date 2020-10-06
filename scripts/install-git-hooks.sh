#!/usr/bin/env sh

for hook in scripts/git-hooks/*; do
  ln -fs "${PWD}/$hook" "${PWD}/.git/hooks/${hook##*/}"
done

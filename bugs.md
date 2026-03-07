# Bugs

## ~~db pull/push commands don't use new config system~~ FIXED

Fixed in d5a06c3. Both commands now use `argv.project` and `RsyncTransfer` with proper SSH port/key support. If no `.procyon` config exists, the middleware exits with an error. Also added `localDomain` and per-env `domain` fields for search-replace, and fixed `RsyncTransfer.ssh()` to include identity file.

## ~~db pull doesn't drop tables before import~~ FIXED

Fixed: added `wp db reset --yes` step before import to clear stale tables when remote uses a different prefix.

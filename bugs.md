# Bugs

## ~~db pull/push commands don't use new config system~~ FIXED

Fixed in d5a06c3. Both commands now check `getProjectFromCwd()` and use `RsyncTransfer` with proper SSH port/key support. Falls back to legacy shell scripts when no `.procyon` config exists. Also added `localDomain` and per-env `domain` fields for search-replace, and fixed `RsyncTransfer.ssh()` to include identity file.

## db pull doesn't drop tables before import

`commands/db/pull.js` imports the remote dump without dropping existing tables first. When the remote uses a different table prefix (e.g., `hjm_`) than local (`wp_`), the old `wp_*` tables remain and the new `hjm_*` tables sit unused since `wp-config.php` still references `wp_`.

Should add `wp db reset --yes` (or `wp db clean`) between the backup step and the import step to ensure a clean slate.

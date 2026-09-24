# XCLUE Member Data

Edit `members.json` to manage the roster. This is designed for 100+ members.

## Identity rule

- `discordId` is the permanent unique identity.
- `name` is only a display/fallback label.
- Never use `name` as a database key or profile identity.
- Lanyard provides the live Discord display name, username, avatar, status and activities.

## Adding a member

Copy an existing object inside `members` and replace it with the real member's data.
At minimum, give the member a unique real Discord ID and their role.

Do not generate fake Discord IDs or placeholder members.

## Developed by Denver
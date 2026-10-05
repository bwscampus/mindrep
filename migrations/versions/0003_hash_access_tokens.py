"""Store only a hash of each session token.

Revision ID: 0003_hash_access_tokens
Revises: 0002_mindrep_user_state

access_tokens.token used to hold the raw session token, the same value the
browser sends in its cookie. Anyone who could read the table (a backup, a
leaked credential, a SQL injection elsewhere) could log in as every signed-in
athlete. The app now stores base64url(sha256(token)) instead (see
app.auth.backend.hash_token), and this migration converts existing rows in
place so nobody is signed out by the deploy.

The SQL expression must produce exactly what hash_token() produces:
sha256 -> base64 -> URL-safe alphabet -> no '=' padding (43 characters, the
same width as the column). tests/test_postgres.py checks the two agree.

Downgrade cannot recover raw tokens from hashes, so it deletes every session
(everyone signs in again) rather than leaving rows the old code can't match.
"""

from typing import Sequence, Union

from alembic import op

revision: str = "0003_hash_access_tokens"
down_revision: Union[str, None] = "0002_mindrep_user_state"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

HASH_SQL = (
    "rtrim(translate(encode(sha256(convert_to({col}, 'UTF8')), 'base64'),"
    " '+/', '-_'), '=')"
)


def upgrade() -> None:
    op.execute(
        "UPDATE access_tokens SET token = " + HASH_SQL.format(col="token")
    )


def downgrade() -> None:
    op.execute("DELETE FROM access_tokens")

"""rename_hashed_password_to_password_hash

Revision ID: ffe439b1cead
Revises: 3f5925fb172a
Create Date: 2025-08-31 12:54:56.187710

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ffe439b1cead'
down_revision = '3f5925fb172a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Rename hashed_password to password_hash to match model expectations
    op.alter_column('users', 'hashed_password', new_column_name='password_hash')


def downgrade() -> None:
    # Rename password_hash back to hashed_password
    op.alter_column('users', 'password_hash', new_column_name='hashed_password')

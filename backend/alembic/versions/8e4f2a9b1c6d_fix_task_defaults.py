"""fix some defaults

Revision ID: 8e4f2a9b1c6d
Revises: 5d628624dcb7
Create Date: 2025-09-12 16:45:33.987654

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8e4f2a9b1c6d'
down_revision = '5d628624dcb7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # set default for total_minutes
    op.alter_column('tasks', 'total_minutes', 
                   existing_type=sa.Integer(), 
                   server_default='0')
    
    # set default for status
    op.alter_column('tasks', 'status',
                   existing_type=sa.Enum('TODO', 'IN_PROGRESS', 'DONE', name='taskstatus'),
                   server_default='TODO')


def downgrade() -> None:
    op.alter_column('tasks', 'status',
                   existing_type=sa.Enum('TODO', 'IN_PROGRESS', 'DONE', name='taskstatus'),
                   server_default=None)
    op.alter_column('tasks', 'total_minutes',
                   existing_type=sa.Integer(),
                   server_default=None)

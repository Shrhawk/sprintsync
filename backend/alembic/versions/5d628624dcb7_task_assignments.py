"""task assignment stuff

Revision ID: 5d628624dcb7
Revises: 3f7a1b8c9d2e
Create Date: 2025-08-30 11:08:26.669357

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5d628624dcb7'
down_revision = '3f7a1b8c9d2e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # add assigned_to col + fk
    op.add_column('tasks', sa.Column('assigned_to', sa.UUID(), nullable=True))
    op.create_foreign_key(
        'fk_tasks_assigned_to_users',
        'tasks', 'users',
        ['assigned_to'], ['id']
    )


def downgrade() -> None:
    # remove the assignment stuff
    op.drop_constraint('fk_tasks_assigned_to_users', 'tasks', type_='foreignkey')
    op.drop_column('tasks', 'assigned_to')

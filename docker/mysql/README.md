# Development test database

On first initialization of a new local MySQL volume, the image creates the
isolated `pear_system_testing` database and grants the configured development
application user access to it. Laravel tests must use this database, never the
development application database.

The official MySQL image runs initialization hooks only for an empty data volume.
An older local volume therefore needs to be recreated or updated explicitly by a
developer. Recreating a volume permanently deletes its local databases; do so only
after confirming that all local data is disposable.

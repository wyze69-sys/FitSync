# FitSync MySQL Backup Notes

Create a local backup:

```bash
mysqldump -u root -p -P 8889 fitsync_db > fitsync_db_backup.sql
```

Restore a local backup:

```bash
mysql -u root -p -P 8889 fitsync_db < fitsync_db_backup.sql
```

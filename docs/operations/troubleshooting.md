# Troubleshooting

## MongoDB connection fails

Check:

- MONGODB_URI
- Atlas IP allowlist
- username/password
- network connection

## Upload fails

Check:

- file size <= 50MB
- allowed MIME type
- R2 credentials
- bucket name

## Signed URL does not load

Check:

- storage key exists
- signed URL expiry
- R2 permissions

## AI service timeout

Check:

- AI_SERVICE_URL
- Railway service running
- file resized to AI copy max 2048px
- model loaded

## Assistant cannot open workspace

Check:

- Task assignedTo current user
- Task exists
- User status ACTIVE
- JWT valid

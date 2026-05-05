# Appwrite Schema Backup — 2026-05-05

## Collections Exported

- **articles**: 7 documents
- **categories**: 10 documents
- **newsletter**: 0 documents
- **ads**: 2 documents
- **whatsapp_groups**: 1 documents
- **user_news**: 0 documents
- **ai_config**: 0 documents
- **system_settings**: 1 documents
- **popups**: 0 documents

## Total Documents: 21

## Field Reference

### articles
- title (string)
- slug (string, unique)
- content (string)
- excerpt (string)
- coverImageId (string, nullable)
- categoryId (string)
- authorId (string)
- isBreaking (boolean)
- isPublished (boolean)
- publishedAt (datetime)
- views (number)
- tags (string[])

### categories
- name (string)
- slug (string, unique)
- color (string)
- icon (string)
- sortOrder (number)

### newsletter
- email (string, unique)
- isActive (boolean)
- subscribedAt (datetime)

### ads
- title (string)
- imageId (string, nullable)
- linkUrl (string)
- format (string: leaderboard|banner|sidebar|square)
- pages (string[]: home|article|category|all)
- startsAt (datetime)
- endsAt (datetime)
- isActive (boolean)
- impressions (number)
- clicks (number)
- dailyLimit (number, nullable)

### whatsapp_groups
- title (string)
- description (string)
- link (string)
- category (string)
- imageId (string, nullable)
- isActive (boolean)
- sortOrder (number)

### user_news
- title (string)
- categoryId (string, nullable)
- description (string)
- location (string)
- whatHappened (string)
- mediaIds (string[])
- authorName (string)
- authorPhone (string)
- authorEmail (string)
- status (string: pending|processing|processed|rejected)
- aiSummary (string, nullable)
- aiCategory (string, nullable)
- aiAnalysis (string, nullable)
- adminNotes (string, nullable)

### ai_config
- provider (string)
- apiKey (string)
- endpoint (string)
- model (string)
- systemPrompt (string)
- isActive (boolean)

### system_settings
- key (string, unique)
- value (string)

### popups
- title (string)
- type (string: image|group)
- imageId (string, nullable)
- linkUrl (string, nullable)
- groupId (string, nullable)
- heading (string, nullable)
- description (string, nullable)
- startsAt (datetime)
- endsAt (datetime)
- isActive (boolean)
- impressions (number)
- clicks (number)
